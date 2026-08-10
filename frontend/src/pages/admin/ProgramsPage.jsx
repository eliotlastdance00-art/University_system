import React from 'react';
import CrudPage from '../../components/CrudPage';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '../../api/programs';

const ProgramsPage = () => (
  <CrudPage
    title="Programs"
    entityLabel="Program"
    fetchAll={getPrograms}
    createItem={createProgram}
    updateItem={updateProgram}
    deleteItem={deleteProgram}
    columns={[
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'department_id', label: 'Department ID' },
    ]}
    searchKeys={['name']}
    formFields={[
      { name: 'name', label: 'Program Name', type: 'text', required: true, placeholder: 'Computer Science' },
      // NOT: department_id şimdilik düz sayı — departments.js'den getDepartments() çekip
      // select'e çevirmek istersen söyle, dropdown'a dönüştürürüm
      { name: 'department_id', label: 'Department ID', type: 'number', required: true },
    ]}
    getItemLabel={(item) => item.name}
  />
);

export default ProgramsPage;