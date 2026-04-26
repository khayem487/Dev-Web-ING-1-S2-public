import requests, json

# 1. Verify MachineCafe has proper levels after seeder
s = requests.Session()
s.post('http://localhost:8080/api/auth/login', json={'email':'parent@demo.local','motDePasse':'demo1234'}).raise_for_status()
objs = s.get('http://localhost:8080/api/gestion/objets').json()
mc = next((o for o in objs if o.get('type')=='MachineCafe'), None)
print('MachineCafe fields after seeder:')
print('  niveauEau =', mc.get('niveauEau'))
print('  niveauCafe =', mc.get('niveauCafe'))
print('  totalPreparations =', mc.get('totalPreparations'))
print('  derniereBoisson =', mc.get('derniereBoisson'))
all_ok = all(mc.get(k) is not None for k in ['niveauEau','niveauCafe','totalPreparations','derniereBoisson'])
print('  all populated?', all_ok)
print()

# 2. Test prepare espresso
mc_id = mc['id']
r = s.put(f'http://localhost:8080/api/gestion/objets/{mc_id}', json={'type':'MachineCafe','nom':'Machine cafe','pieceId':2,'boisson':'ESPRESSO','coffeeAction':'preparer'})
print('Prepare Espresso: HTTP', r.status_code)
data = r.json()
print('  niveauEau =', data.get('niveauEau'), '(expected 72, was 80 consumed 8)')
print('  niveauCafe =', data.get('niveauCafe'), '(expected 48, was 60 consumed 12)')
print('  totalPreparations =', data.get('totalPreparations'), '(expected 1)')
print('  derniereBoisson =', data.get('derniereBoisson'), '(expected ESPRESSO)')
print()

# 3. Test refill
r2 = s.put(f'http://localhost:8080/api/gestion/objets/{mc_id}', json={'type':'MachineCafe','nom':'Machine cafe','pieceId':2,'coffeeAction':'remplir-eau'})
r2.raise_for_status()
r3 = s.put(f'http://localhost:8080/api/gestion/objets/{mc_id}', json={'type':'MachineCafe','nom':'Machine cafe','pieceId':2,'coffeeAction':'remplir-cafe'})
r3.raise_for_status()
d3 = r3.json()
print('After refill: niveauEau =', d3.get('niveauEau'), ', niveauCafe =', d3.get('niveauCafe'), ' (both expected 100)')
print()

# 4. Invalid drink code -> 409 Conflict (not 500)
r4 = s.put(f'http://localhost:8080/api/gestion/objets/{mc_id}', json={'type':'MachineCafe','nom':'Machine cafe','pieceId':2,'boisson':'FAKE_DRINK','coffeeAction':'preparer'})
print('Fake drink code: HTTP', r4.status_code, '(expected 409, not 500)')
print('  Response:', r4.text[:120])