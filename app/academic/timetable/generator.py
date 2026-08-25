"""
Advanced Timetable Generator — CSP + Backtracking Algorithm

Bu modül, üniversite ders programını otomatik oluşturur.
Basit greedy yerine, Constraint Satisfaction Problem (CSP) tabanlı
Backtracking algoritması kullanır.

Özellikler:
  - 80 dakikalık para sistemi (time_slots tablosundan)
  - Oda kapasitesi ve tip eşleştirme (rooms tablosundan)
  - Öğretmen müsaitlik kontrolü (teacher_availabilities)
  - Birleşen sınıf desteği (lecture_groups)
  - Haftalık ders saati desteği (weekly_hours)
  - Peş peşe (blok) ders yerleştirme
  - MRV (Minimum Remaining Values) sıralama
  - Backtracking ile geri izleme
  - Öğrenci pencere (boşluk) minimizasyonu (soft constraint)
"""

import logging
from dataclasses import dataclass, field

from app.academic.timetable.repository import TimetableRepository

logger = logging.getLogger(__name__)

DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]


@dataclass
class SlotInfo:
    """Bir zaman diliminin bilgileri."""
    slot_number: int
    start_time: str
    end_time: str


@dataclass
class RoomInfo:
    """Bir dersliğin bilgileri."""
    id: int
    name: str
    capacity: int
    room_type: str


@dataclass
class AssignmentTask:
    """
    Jeneratörün yerleştirmesi gereken tek bir birim.
    weekly_hours > 1 ise bu assignment birden fazla slot'a yerleştirilmeli.
    Lecture group üyesiyse, gruptaki diğer assignment'larla aynı slot'a konulmalı.
    """
    assignment_id: int
    teacher_id: int
    teacher_name: str
    subject_id: int
    subject_name: str
    section_id: int
    section_number: str
    section_capacity: int
    weekly_hours: int
    required_room_type: str
    semester: str | None

    # Lecture group info (if part of one)
    lecture_group_id: int | None = None
    lecture_group_member_ids: list[int] = field(default_factory=list)
    combined_capacity: int = 0  # Total students when sections merge


@dataclass
class PlacedSlot:
    """Atanmış bir ders slotu."""
    assignment_id: int
    day: str
    slot_number: int
    start_time: str
    end_time: str
    room_id: int
    room_name: str


async def run_timetable_generation(conn, task_id: int, parameters: dict):
    """
    Advanced Timetable Generator — Ana giriş noktası.
    Worker tarafından çağırılır.
    """
    repo = TimetableRepository(conn)

    try:
        # 1. Durumu PROCESSING yap
        await repo.update_task_status(task_id, "PROCESSING")
        logger.info(f"Task {task_id}: Generation started")

        # 2. Tüm verileri yükle
        semester = parameters.get("semester")
        raw_assignments = await repo.fetch_assignments_for_generation(semester)
        rooms = await repo.fetch_active_rooms()
        time_slots = await repo.get_all_time_slots()
        all_availabilities = await repo.get_all_teacher_availabilities()
        lecture_group_map = await repo.fetch_lecture_group_map()

        if not raw_assignments:
            await repo.update_task_status(
                task_id, "FAILED",
                error_message="No assignments found for the given parameters"
            )
            return

        if not rooms:
            await repo.update_task_status(
                task_id, "FAILED",
                error_message="No active rooms found in the system"
            )
            return

        if not time_slots:
            await repo.update_task_status(
                task_id, "FAILED",
                error_message="No time slots configured in the system"
            )
            return

        # 3. Veri yapılarını hazırla
        slot_infos = [
            SlotInfo(
                slot_number=ts["slot_number"],
                start_time=ts["start_time"],
                end_time=ts["end_time"],
            )
            for ts in time_slots
        ]

        room_infos = [
            RoomInfo(
                id=r["id"],
                name=r["name"],
                capacity=r["capacity"],
                room_type=r["room_type"],
            )
            for r in rooms
        ]


        # Teacher availability map: teacher_id -> set of (day, slot_number)
        # Eğer bir hocanın hiç availability kaydı yoksa → tüm slotlarda müsait
        teacher_avail_map: dict[int, set[tuple[str, int]]] = {}
        teachers_with_avail: set[int] = set()
        for av in all_availabilities:
            tid = av["user_id"]
            teachers_with_avail.add(tid)
            teacher_avail_map.setdefault(tid, set()).add((av["day"], av["slot_number"]))

        # 4. Assignment tasks oluştur (lecture group birleştirme dahil)
        tasks = _build_assignment_tasks(raw_assignments, lecture_group_map)

        # 5. MRV Sıralama: En kısıtlı olan önce
        tasks = _sort_by_difficulty(tasks, teacher_avail_map, teachers_with_avail, room_infos, slot_infos)

        # 6. Önceki taslakları temizle
        await repo.delete_drafts_by_task(task_id)

        # 7. CSP + Backtracking ile çözüm bul
        solution = _solve_csp(
            tasks=tasks,
            days=DAYS,
            slot_infos=slot_infos,
            room_infos=room_infos,
            teacher_avail_map=teacher_avail_map,
            teachers_with_avail=teachers_with_avail,
        )

        if solution is None:
            # Hangi dersin yerleştirilemediğini bulmaya çalış
            failed_info = _find_failure_reason(
                tasks, DAYS, slot_infos, room_infos,
                teacher_avail_map, teachers_with_avail
            )
            await repo.update_task_status(
                task_id, "FAILED",
                error_message=f"Could not find a valid timetable. {failed_info}"
            )
            return

        # 8. Çözümü draft olarak kaydet
        for placed in solution:
            await repo.create_draft(
                task_id=task_id,
                assignment_id=placed.assignment_id,
                day=placed.day,
                start_time=placed.start_time,
                end_time=placed.end_time,
                room=placed.room_name,
                room_id=placed.room_id,
            )

        # 9. Başarılı
        await repo.update_task_status(task_id, "COMPLETED")
        logger.info(f"Task {task_id}: Successfully generated {len(solution)} slots")

    except Exception as e:
        logger.exception(f"Task {task_id}: Generation failed with error")
        await repo.update_task_status(task_id, "FAILED", error_message=str(e))


# ═══════════════════════════════════════════════════════════════
# INTERNAL HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════


def _build_assignment_tasks(
    raw_assignments: list[dict],
    lecture_group_map: dict,
) -> list[AssignmentTask]:
    """
    raw_assignments listesini AssignmentTask listesine dönüştür.
    Lecture group üyelerini birleştir: Grup içindeki assignment'lar
    tek bir "sanal task" olarak ele alınır (aynı slot + oda paylaşır).
    """
    processed_groups: set[int] = set()
    tasks: list[AssignmentTask] = []
    assignment_dict = {a["assignment_id"]: a for a in raw_assignments}

    for asgn in raw_assignments:
        aid = asgn["assignment_id"]

        if aid in lecture_group_map:
            group_info = lecture_group_map[aid]
            gid = group_info["group_id"]

            if gid in processed_groups:
                continue  # Bu grubun temsilcisini zaten ekledik
            processed_groups.add(gid)

            # Gruptaki tüm sectionların toplam kapasitesini hesapla
            member_ids = group_info["assignment_ids"]
            total_capacity = sum(
                assignment_dict[mid]["section_capacity"]
                for mid in member_ids
                if mid in assignment_dict
            )

            # Temsilci olarak ilk üyeyi kullan
            first = assignment_dict.get(member_ids[0], asgn)
            task = AssignmentTask(
                assignment_id=aid,
                teacher_id=first["teacher_id"],
                teacher_name=first["teacher_name"],
                subject_id=first["subject_id"],
                subject_name=first["subject_name"],
                section_id=first["section_id"],
                section_number=first["section_number"],
                section_capacity=first["section_capacity"],
                weekly_hours=first["weekly_hours"],
                required_room_type=first["required_room_type"],
                semester=first.get("semester"),
                lecture_group_id=gid,
                lecture_group_member_ids=member_ids,
                combined_capacity=total_capacity,
            )
            tasks.append(task)
        else:
            task = AssignmentTask(
                assignment_id=aid,
                teacher_id=asgn["teacher_id"],
                teacher_name=asgn["teacher_name"],
                subject_id=asgn["subject_id"],
                subject_name=asgn["subject_name"],
                section_id=asgn["section_id"],
                section_number=asgn["section_number"],
                section_capacity=asgn["section_capacity"],
                weekly_hours=asgn["weekly_hours"],
                required_room_type=asgn["required_room_type"],
                semester=asgn.get("semester"),
            )
            tasks.append(task)

    return tasks


def _sort_by_difficulty(
    tasks: list[AssignmentTask],
    teacher_avail_map: dict[int, set[tuple[str, int]]],
    teachers_with_avail: set[int],
    room_infos: list[RoomInfo],
    slot_infos: list[SlotInfo],
) -> list[AssignmentTask]:
    """
    MRV (Minimum Remaining Values) sıralama:
    En az olası slot seçeneği olan dersi önce yerleştir.
    Bu, backtracking'in daha verimli çalışmasını sağlar.
    """

    def difficulty_score(task: AssignmentTask) -> int:
        # Uygun oda sayısı (kapasite + tip eşleşen)
        required_cap = task.combined_capacity if task.lecture_group_id else task.section_capacity
        matching_rooms = sum(
            1 for r in room_infos
            if r.capacity >= required_cap and r.room_type == task.required_room_type
        )

        # Müsait gün×slot sayısı
        if task.teacher_id in teachers_with_avail:
            available_slots = len(teacher_avail_map.get(task.teacher_id, set()))
        else:
            # Müsaitlik kaydı yok → tüm slotlar müsait
            available_slots = len(DAYS) * len(slot_infos)

        # weekly_hours fazla olan daha zor (daha çok slot lazım)
        # Score ne kadar düşükse o kadar zor → önce yerleştirilir
        return matching_rooms * available_slots // max(task.weekly_hours, 1)

    return sorted(tasks, key=difficulty_score)


def _solve_csp(
    tasks: list[AssignmentTask],
    days: list[str],
    slot_infos: list[SlotInfo],
    room_infos: list[RoomInfo],
    teacher_avail_map: dict[int, set[tuple[str, int]]],
    teachers_with_avail: set[int],
) -> list[PlacedSlot] | None:
    """
    CSP + Backtracking solver.

    Her task'ı weekly_hours kadar slot'a yerleştirmeye çalışır.
    Tüm kısıtlar sağlanmazsa backtrack eder.
    """

    # Çakışma takip yapıları
    teacher_schedule: dict[int, set[tuple[str, int]]] = {}    # teacher_id -> {(day, slot)}
    section_schedule: dict[int, set[tuple[str, int]]] = {}    # section_id -> {(day, slot)}
    room_schedule: dict[int, set[tuple[str, int]]] = {}       # room_id -> {(day, slot)}

    # Sonuç listesi
    solution: list[PlacedSlot] = []

    # Her task'ı genişlet: weekly_hours > 1 ise birden fazla "slot ihtiyacı" var
    expanded_tasks: list[tuple[AssignmentTask, int]] = []
    for task in tasks:
        for hour_idx in range(task.weekly_hours):
            expanded_tasks.append((task, hour_idx))

    def _is_teacher_available(teacher_id: int, day: str, slot_num: int) -> bool:
        """Hoca o gün ve saatte müsait mi?"""
        if teacher_id not in teachers_with_avail:
            return True  # Müsaitlik kaydı yoksa her yerde müsait
        return (day, slot_num) in teacher_avail_map.get(teacher_id, set())

    def _check_constraints(
        task: AssignmentTask, day: str, slot: SlotInfo, room: RoomInfo
    ) -> bool:
        """Tüm hard constraint'leri kontrol et."""
        slot_key = (day, slot.slot_number)

        # 1. Öğretmen çakışması
        if slot_key in teacher_schedule.get(task.teacher_id, set()):
            return False

        # 2. Öğretmen müsaitliği
        if not _is_teacher_available(task.teacher_id, day, slot.slot_number):
            return False

        # 3. Section çakışması
        if task.lecture_group_id:
            # Lecture group: tüm üye section'ları kontrol et
            # Şimdilik ana section'ı kontrol edelim
            if slot_key in section_schedule.get(task.section_id, set()):
                return False
        else:
            if slot_key in section_schedule.get(task.section_id, set()):
                return False

        # 4. Oda çakışması
        if slot_key in room_schedule.get(room.id, set()):
            return False

        # 5. Oda kapasitesi
        required_cap = task.combined_capacity if task.lecture_group_id else task.section_capacity
        if room.capacity < required_cap:
            return False

        # 6. Oda tipi
        return room.room_type == task.required_room_type

    def _assign(task: AssignmentTask, day: str, slot: SlotInfo, room: RoomInfo):
        """Atama yap ve schedule'ları güncelle."""
        slot_key = (day, slot.slot_number)
        teacher_schedule.setdefault(task.teacher_id, set()).add(slot_key)
        section_schedule.setdefault(task.section_id, set()).add(slot_key)
        room_schedule.setdefault(room.id, set()).add(slot_key)

        solution.append(PlacedSlot(
            assignment_id=task.assignment_id,
            day=day,
            slot_number=slot.slot_number,
            start_time=slot.start_time,
            end_time=slot.end_time,
            room_id=room.id,
            room_name=room.name,
        ))

        # Lecture group: aynı slot'u tüm üye assignment'lar için de kaydet
        if task.lecture_group_id and task.lecture_group_member_ids:
            for member_aid in task.lecture_group_member_ids:
                if member_aid != task.assignment_id:
                    solution.append(PlacedSlot(
                        assignment_id=member_aid,
                        day=day,
                        slot_number=slot.slot_number,
                        start_time=slot.start_time,
                        end_time=slot.end_time,
                        room_id=room.id,
                        room_name=room.name,
                    ))

    def _unassign(task: AssignmentTask, day: str, slot: SlotInfo, room: RoomInfo):
        """Atamayı geri al (backtrack)."""
        slot_key = (day, slot.slot_number)
        teacher_schedule.get(task.teacher_id, set()).discard(slot_key)
        section_schedule.get(task.section_id, set()).discard(slot_key)
        room_schedule.get(room.id, set()).discard(slot_key)

        # Son eklenen slotları kaldır
        members_to_remove = {task.assignment_id}
        if task.lecture_group_id and task.lecture_group_member_ids:
            members_to_remove.update(task.lecture_group_member_ids)

        # Remove from solution (reverse to maintain order)
        i = len(solution) - 1
        while i >= 0:
            s = solution[i]
            if (s.assignment_id in members_to_remove
                    and s.day == day
                    and s.slot_number == slot.slot_number
                    and s.room_id == room.id):
                solution.pop(i)
            i -= 1

    def _get_section_day_slots(section_id: int, day: str) -> list[int]:
        """Bir section'ın belirli bir günde dolu olan slot numaraları."""
        return sorted([
            sn for (d, sn) in section_schedule.get(section_id, set())
            if d == day
        ])

    def _compactness_penalty(task: AssignmentTask, day: str, slot: SlotInfo) -> int:
        """
        Soft constraint: Öğrenci boşluğu (pencere) cezası.
        Mevcut derslerin yanına yerleştirmek tercih edilir.
        Daha düşük penalty = daha iyi.
        """
        existing = _get_section_day_slots(task.section_id, day)
        if not existing:
            return 0  # İlk ders, ceza yok

        # Mevcut slotlarla gap hesapla
        test_slots = sorted(existing + [slot.slot_number])
        gaps = 0
        for i in range(1, len(test_slots)):
            gap = test_slots[i] - test_slots[i - 1] - 1
            if gap > 0:
                gaps += gap
        return gaps

    import time
    start_time = time.time()
    iterations = 0

    def _backtrack(task_idx: int) -> bool:
        """Recursive backtracking."""
        nonlocal iterations
        iterations += 1
        
        # Timeout after 15 seconds or too many iterations to prevent combinatorial explosion
        if time.time() - start_time > 15 or iterations > 500000:
            return False

        if task_idx >= len(expanded_tasks):
            return True  # Tüm dersler yerleştirildi!

        task, hour_idx = expanded_tasks[task_idx]

        # Blok ders mantığı: weekly_hours > 1 ve hour_idx > 0 ise
        # Önceki slot ile aynı günde peş peşe yerleştirmeyi dene
        candidates = []

        if hour_idx > 0:
            # Önceki atamayı bul
            prev_placements = [
                s for s in solution
                if s.assignment_id == task.assignment_id
            ]
            if prev_placements:
                last = prev_placements[-1]
                # Aynı gün, bir sonraki slot'u dene
                next_slot_num = last.slot_number + 1
                matching_slot = next(
                    (s for s in slot_infos if s.slot_number == next_slot_num), None
                )
                if matching_slot:
                    # Aynı odayı tercih et
                    matching_room = next(
                        (r for r in room_infos if r.id == last.room_id), None
                    )
                    if matching_room:
                        candidates.append((last.day, matching_slot, matching_room, -100))

                    # Aynı gün, aynı slot, farklı oda
                    for room in room_infos:
                        if room.id != last.room_id:
                            candidates.append((last.day, matching_slot, room, -50))

                # Aynı gün değilse diğer günleri de dene (fall through)

        if not candidates or hour_idx == 0:
            # Normal aday üretimi: tüm (gün, slot, oda) kombinasyonları
            for day in days:
                for slot in slot_infos:
                    for room in room_infos:
                        penalty = _compactness_penalty(task, day, slot)
                        candidates.append((day, slot, room, penalty))

        # Penalty'ye göre sırala (düşük = daha iyi)
        candidates.sort(key=lambda c: c[3])

        for day, slot, room, _ in candidates:
            if _check_constraints(task, day, slot, room):
                _assign(task, day, slot, room)

                if _backtrack(task_idx + 1):
                    return True

                # Backtrack
                _unassign(task, day, slot, room)

        return False  # Bu task için uygun yer bulunamadı

    # Ana çözüm
    if _backtrack(0):
        return solution
    return None


def _find_failure_reason(
    tasks: list[AssignmentTask],
    days: list[str],
    slot_infos: list[SlotInfo],
    room_infos: list[RoomInfo],
    teacher_avail_map: dict[int, set[tuple[str, int]]],
    teachers_with_avail: set[int],
) -> str:
    """
    Çözüm bulunamadığında, hangi dersin neden yerleştirilemediğini analiz et.
    Detaylı hata mesajı üretir.
    """
    issues = []

    for task in tasks:
        required_cap = task.combined_capacity if task.lecture_group_id else task.section_capacity

        # Uygun oda var mı?
        matching_rooms = [
            r for r in room_infos
            if r.capacity >= required_cap and r.room_type == task.required_room_type
        ]
        if not matching_rooms:
            issues.append(
                f"'{task.subject_name}' (Section: {task.section_number}): "
                f"No room with type={task.required_room_type} and capacity>={required_cap}"
            )
            continue

        # Hoca müsaitliği yeterli mi?
        if task.teacher_id in teachers_with_avail:
            avail_count = len(teacher_avail_map.get(task.teacher_id, set()))
            if avail_count < task.weekly_hours:
                issues.append(
                    f"'{task.subject_name}' (Teacher: {task.teacher_name}): "
                    f"Teacher has only {avail_count} available slots but needs {task.weekly_hours}"
                )

    if issues:
        return "Specific issues: " + "; ".join(issues[:5])
    return "General capacity/conflict issue — too many assignments for available slots."
