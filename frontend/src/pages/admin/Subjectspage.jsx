import React, { useState, useEffect } from 'react';
import CrudPage from '../../components/CrudPage';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../api/subjects';
import { getAllDepartments } from '../../api/department';

const SubjectsPage = () => {
  const [departments, setDepartments] = useState([]);
  const [loadingDeps, setLoadingDeps] = useState(true);

  useEffect(() => {
    getAllDepartments()
      .then((res) => setDepartments(res.data))
      .finally(() => setLoadingDeps(false));
  }, []);

  if (loadingDeps) {
    return (
      <div className="page-loader">
        <span className="spinner spinner-lg" />
      </div>
    );
  }

  const departmentOptions = departments.map((d) => ({
    value: d.id,
    label: `${d.name} (${d.faculty_name})`,
  }));

  // Subjects only carry department_id/department_name — not faculty_name —
  // so the group color needs this lookup instead of reading item.faculty_name.
  const facultyByDepartmentId = departments.reduce((acc, d) => {
    acc[d.id] = d.faculty_name;
    return acc;
  }, {});

  return (
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
        { key: 'credits', label: 'Credits' },
      ]}
      searchKeys={['name', 'department_name']}
      formFields={[
        { name: 'name', label: 'Subject Name', type: 'text', required: true, placeholder: 'Algorithms' },
        { name: 'credits', label: 'Credits', type: 'number', required: true, placeholder: '3' },
        {
          name: 'department_id',
          label: 'Department',
          type: 'select',
          required: true,
          numeric: true, // department_id is an int on the backend — coerce from the <select>'s string value
          options: departmentOptions,
        },
      ]}
      groupBy={{
        getKey: (item) => facultyByDepartmentId[item.department_id] || 'Unknown',
        getLabel: (item) => facultyByDepartmentId[item.department_id] || 'Unknown',
        getColorKey: (item) => facultyByDepartmentId[item.department_id] || 'Unknown',
        subGroupBy: {
          getKey: (item) => item.department_id,
          getLabel: (item) => item.department_name,
        },
      }}
      getItemLabel={(item) => item.name}
    />
  );
};

export default SubjectsPage;