db.createUser(
    {
        user: 'barbakUser',
        pwd: 'Password@1234',
        roles: [
            {
                role: 'readWrite',
                db: 'barbak'
            }
        ]
    }
);