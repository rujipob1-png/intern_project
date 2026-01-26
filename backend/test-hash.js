import bcrypt from 'bcrypt';

const password = '123456';
const hashFromDatabase = '$2b$10$DmslwEVkoBKz6sfURIIxleVUGyuyHt3iNa/ibfh5htIT4hj.LrqJm';

const testHash = async () => {
  const isValid = await bcrypt.compare(password, hashFromDatabase);
  console.log('Testing password:', password);
  console.log('Against hash:', hashFromDatabase);
  console.log('Result:', isValid ? '✅ VALID' : '❌ INVALID');
};

testHash();
