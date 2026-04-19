from werkzeug.security import check_password_hash
h = 'scrypt:32768:8:1$DmzKOIk6RX1trMmf$4657bf1fc90c3c6e72f8aa27d1fb2c7d32fcfae1b5466e2cf51c9f74043294dbeedd7803aedc28e55cc3ff6548c9661d0bf6b391ae28b368dbe75abe81513462'
print(f'Password 123456 match: {check_password_hash(h, "123456")}')
