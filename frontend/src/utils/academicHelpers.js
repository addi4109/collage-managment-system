export const getSemestersForYear = (year) => {
  if (year === 'First Year') return ['Sem 1', 'Sem 2'];
  if (year === 'Second Year') return ['Sem 3', 'Sem 4'];
  if (year === 'Third Year') return ['Sem 5', 'Sem 6'];
  return ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
};
