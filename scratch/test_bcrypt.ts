import bcrypt from 'bcryptjs'

async function checkHash() {
  const password = 'Admin@123'
  const hashInDb = '$2b$10$Na5ifj8Ijj0jxNRCwqUTZOARuri3xz.mOGUQzzYu1r9biyJPE.632'
  const match = await bcrypt.compare(password, hashInDb)
  console.log('Password Match for Admin@123:', match)
}

checkHash()
