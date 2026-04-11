import('./src/config/database.js').then(async () => {
  const StudentModel = await import('./src/models/Student.js');
  const UserModel = await import('./src/models/User.js');
  const Student = StudentModel.default;
  const User = UserModel.default;
  
  const users = await User.find({});
  console.log('\n=== ALL USERS ===');
  users.forEach(u => console.log(`${u.name} (${u.role}): ID=${u._id}`));
  
  const students = await Student.find({});
  console.log('\n=== ALL STUDENTS ===');
  if (students.length === 0) {
    console.log('NO STUDENT RECORDS FOUND');
  } else {
    students.forEach(s => console.log(`${s.name}: userId=${s.userId}`));
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
