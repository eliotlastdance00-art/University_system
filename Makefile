# ═══════════════════════════════════════════════════════════
# University_system — Makefile
# Ulanyş: make <command>   mysal: make up  /  make logs
# ═══════════════════════════════════════════════════════════

.PHONY: help up down build rebuild logs ps shell-backend shell-db \
        clean prune db-migrate status

# Reňkli çykyş üçin
GREEN  := \033[0;32m
YELLOW := \033[1;33m
CYAN   := \033[0;36m
RESET  := \033[0m

## ── Kömek ───────────────────────────────────────────────────────
help:
	@echo ""
	@echo "$(CYAN)╔══════════════════════════════════════════╗$(RESET)"
	@echo "$(CYAN)║      University_system — Docker CLI      ║$(RESET)"
	@echo "$(CYAN)╚══════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(GREEN)Esasy komandalar:$(RESET)"
	@echo "  $(YELLOW)make up$(RESET)            — ähli container-lary başlat (detach)"
	@echo "  $(YELLOW)make down$(RESET)          — ähli container-lary durdur"
	@echo "  $(YELLOW)make build$(RESET)         — image-leri döret (cache bilen)"
	@echo "  $(YELLOW)make rebuild$(RESET)       — image-leri gaýtadan döret (cache ýok)"
	@echo "  $(YELLOW)make logs$(RESET)          — ähli loglary görkez (follow)"
	@echo "  $(YELLOW)make ps$(RESET)            — işleýän container-lary görkez"
	@echo "  $(YELLOW)make status$(RESET)        — health statusy görkez"
	@echo ""
	@echo "$(GREEN)Debug komandalar:$(RESET)"
	@echo "  $(YELLOW)make shell-backend$(RESET) — backend container-a gir"
	@echo "  $(YELLOW)make shell-db$(RESET)      — MySQL-e gir"
	@echo "  $(YELLOW)make logs-backend$(RESET)  — diňe backend log-lary"
	@echo "  $(YELLOW)make logs-frontend$(RESET) — diňe frontend log-lary"
	@echo "  $(YELLOW)make logs-db$(RESET)       — diňe database log-lary"
	@echo ""
	@echo "$(GREEN)Arassalaýyş:$(RESET)"
	@echo "  $(YELLOW)make clean$(RESET)         — container-lary we volume-lary öçür"
	@echo "  $(YELLOW)make prune$(RESET)         — ulanylmaýan Docker obýektleri arassala"
	@echo ""

## ── Esasy komandalar ────────────────────────────────────────────

# Ähli service-leri fonda başlatmak
up:
	@echo "$(GREEN)▶ Container-lar başladylýar...$(RESET)"
	docker compose up -d
	@echo "$(GREEN)✅ Taýýar! http://localhost açyk$(RESET)"

# Ähli service-leri durdurmak
down:
	@echo "$(YELLOW)⏹ Container-lar durdurylyýar...$(RESET)"
	docker compose down

# Image-leri build etmek (cache bilen)
build:
	@echo "$(GREEN)🔨 Image-ler build edilýär...$(RESET)"
	docker compose build

# Image-leri cache-siz gaýtadan build etmek
rebuild:
	@echo "$(YELLOW)🔄 Cache-siz gaýtadan build edilýär...$(RESET)"
	docker compose build --no-cache
	docker compose up -d

# Ähli loglary yzarlamak
logs:
	docker compose logs -f

# Aýry loglary
logs-backend:
	docker compose logs -f app

logs-frontend:
	docker compose logs -f web

logs-db:
	docker compose logs -f Database

# Container-laryň statusy
ps:
	docker compose ps

# Health statusy
status:
	@echo "$(CYAN)── Container statusy ───────────────────$(RESET)"
	@docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "$(CYAN)── Health check ────────────────────────$(RESET)"
	@docker inspect --format='{{.Name}}: {{.State.Health.Status}}' \
		$$(docker compose ps -q) 2>/dev/null || echo "Health info ýok"

## ── Shell / Debug ───────────────────────────────────────────────

# Backend container-a girmek
shell-backend:
	docker compose exec app /bin/sh

# MySQL-e girmek
shell-db:
	docker compose exec Database mysql -u$${MYSQL_USER} -p$${MYSQL_PASSWORD} $${MYSQL_DATABASE}

## ── Arassalaýyş ─────────────────────────────────────────────────

# Container + volume-lary öçürmek (DB data ýiter!)
clean:
	@echo "$(YELLOW)⚠️  DB data hem öçüriler! Dowam etmekmi? [y/N]$(RESET)" && read ans && [ $${ans:-N} = y ]
	docker compose down -v --remove-orphans
	@echo "$(GREEN)✅ Arassalandy$(RESET)"

# Ulanylmaýan Docker obýektlerini arassalamak
prune:
	@echo "$(YELLOW)🧹 Ulanylmaýan image/network/cache arassalanýar...$(RESET)"
	docker system prune -f
	@echo "$(GREEN)✅ Taýýar$(RESET)"
