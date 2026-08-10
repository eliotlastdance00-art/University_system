import React from 'react';
import CrudPage from '../../components/CrudPage';
import { getAcademicYears, createAcademicYear, updateAcademicYear } from '../../api/academic_years';

const AcademicYearsPage = () => (
  <CrudPage
    title="Academic Years"
    entityLabel="Academic Year"
    fetchAll={getAcademicYears}
    createItem={createAcademicYear}
    updateItem={updateAcademicYear}
    // deleteItem verilmedi — backend'de DELETE endpoint'i yok, "Delete" butonu otomatik gizlenir
    columns={[
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
      { key: 'is_active', label: 'Status', render: (item) => (
        <span className={`badge ${item.is_active ? 'badge-success' : 'badge-error'}`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      )},
    ]}
    searchKeys={['name']}
    formFields={[
      { name: 'name', label: 'Year Name', type: 'text', required: true, placeholder: '2025-2026' },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date', required: true },
      { name: 'is_active', label: 'Active', type: 'select', options: [
        { value: true, label: 'Active' },
        { value: false, label: 'Inactive' },
      ]},
    ]}
    getItemLabel={(item) => item.name}
  />
);

export default AcademicYearsPage;