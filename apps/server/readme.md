Setup:
pnpm install

Create .env


To Run : 
pnpm --filter server dev 


Test:
SignUp:
curl -X POST http://localhost:4000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"123456","name":"Test User"}'

Login:
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"123456"}'


Token ME:
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer <your_token_here>"
