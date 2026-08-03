import React from 'react';
import CrudPage from '../../components/CrudPage';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../api/subjects';

const SubjectsPage = () => (
  <CrudPage
    title="Subjects"
    entityLabel="Subject"
    fetchAll={getSubjects}
    createItem={createSubject}
    updateItem={updateSubject}
    deleteItem={deleteSubject}
    columns={[
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'code', label: 'Code' },
    ]}
    searchKeys={['name', 'code']}
    formFields={[
      { name: 'name', label: 'Subject Name', type: 'text', required: true, placeholder: 'Algorithms' },
      { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'CS201' },
    ]}
    getItemLabel={(item) => item.name}
  />
);

export default SubjectsPage;