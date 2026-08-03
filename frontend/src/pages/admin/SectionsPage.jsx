import React, { useState, useEffect } from 'react';
import CrudPage from '../../components/CrudPage';
import { getCohorts, createCohort, updateCohort, deleteCohort } from '../../api/cohorts';
import { getPrograms } from '../../api/programs';
import { getAcademicYears } from '../../api/academic_years';

const CohortsPage = () => {
  // ── Dropdown seçenekleri için Programs ve Academic Years'ı önceden çek ──
  const [programOptions, setProgramOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPrograms(), getAcademicYears()]).then(([progRes, yearRes]) => {
      setProgramOptions(progRes.data.map((p) => ({ value: p.id, label: p.name })));
      setYearOptions(yearRes.data.map((y) => ({ value: y.id, label: y.name })));
      setOptionsLoading(false);
    });
  }, []);

  // Seçenekler yüklenene kadar formu render etmiyoruz — yoksa dropdown'lar boş açılır
  if (optionsLoading) {
    return (
      <div className="page-loader">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <CrudPage
      title="Cohorts"
      entityLabel="Cohort"
      fetchAll={getCohorts}
      createItem={createCohort}
      updateItem={updateCohort}
      deleteItem={deleteCohort}
      columns={[
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'program_id', label: 'Program', render: (item) =>
          programOptions.find((p) => p.value === item.program_id)?.label || item.program_id
        },
        { key: 'academic_year_id', label: 'Academic Year', render: (item) =>
          yearOptions.find((y) => y.value === item.academic_year_id)?.label || item.academic_year_id
        },
      ]}
      searchKeys={['name']}
      formFields={[
        { name: 'name', label: 'Cohort Name', type: 'text', required: true, placeholder: 'CS-2025-A' },
        { name: 'program_id', label: 'Program', type: 'select', required: true, options: programOptions },
        { name: 'academic_year_id', label: 'Academic Year', type: 'select', required: true, options: yearOptions },
      ]}
      getItemLabel={(item) => item.name}
    />
  );
};

export default CohortsPage;