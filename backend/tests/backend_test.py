"""Backend API tests for ASCAP Ditari (admin, license, archive, deactivate flow).

Skips the AI /ditar/generate call to preserve credits (already verified via curl).
"""
import os
import requests
import pytest

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fallback - read frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE}/api"
ADMIN_PW = "artikleo"


@pytest.fixture(scope="module")
def admin_headers():
    return {"X-Admin-Password": ADMIN_PW}


@pytest.fixture(scope="module")
def created_license(admin_headers):
    """Create a 2-subject license for the test module."""
    r = requests.post(f"{API}/admin/licenses", json={"numriLendeve": 2}, headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["numriLendeve"] == 2
    assert data["kodi"].startswith("ASCAP-")
    assert data["aktiv"] is True
    assert data["aktivizuar"] is False
    yield data
    # cleanup
    requests.delete(f"{API}/admin/licenses/{data['kodi']}", headers=admin_headers, timeout=10)


# ---------- Admin ----------
class TestAdmin:
    def test_login_ok(self):
        r = requests.post(f"{API}/admin/login", json={"password": ADMIN_PW}, timeout=10)
        assert r.status_code == 200
        assert r.json()["ok"] is True

    def test_login_wrong(self):
        r = requests.post(f"{API}/admin/login", json={"password": "wrong"}, timeout=10)
        assert r.status_code == 401

    def test_list_requires_admin(self):
        assert requests.get(f"{API}/admin/licenses", timeout=10).status_code == 401

    def test_list_ok(self, admin_headers):
        r = requests.get(f"{API}/admin/licenses", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_invalid_package(self, admin_headers):
        r = requests.post(f"{API}/admin/licenses", json={"numriLendeve": 5}, headers=admin_headers, timeout=10)
        assert r.status_code == 400


# ---------- License ----------
class TestLicense:
    def test_activate_wrong_code(self):
        r = requests.post(f"{API}/license/activate", json={
            "kodi": "ASCAP-NOPE00-0000", "emri": "A", "mbiemri": "B",
            "email": "a@b.com", "numriLendeve": 1, "lendet": ["Matematikë"],
        }, timeout=10)
        assert r.status_code == 404

    def test_activate_package_mismatch(self, created_license):
        r = requests.post(f"{API}/license/activate", json={
            "kodi": created_license["kodi"], "emri": "A", "mbiemri": "B",
            "email": "test@ascap.al", "numriLendeve": 1, "lendet": ["Matematikë"],
        }, timeout=10)
        assert r.status_code == 400

    def test_activate_success(self, created_license):
        payload = {
            "kodi": created_license["kodi"], "emri": "Test", "mbiemri": "Mesues",
            "email": "test@ascap.al", "numriLendeve": 2,
            "lendet": ["Matematikë", "Gjuhë Shqipe"],
        }
        r = requests.post(f"{API}/license/activate", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["aktivizuar"] is True
        assert d["lendet"] == ["Matematikë", "Gjuhë Shqipe"]
        assert d["emri"] == "Test"

        # verify persistence via /license/me
        me = requests.get(f"{API}/license/me", headers={"X-License": created_license["kodi"]}, timeout=10)
        assert me.status_code == 200
        assert me.json()["email"] == "test@ascap.al"

    def test_activate_duplicate_different_email(self, created_license):
        r = requests.post(f"{API}/license/activate", json={
            "kodi": created_license["kodi"], "emri": "Other", "mbiemri": "User",
            "email": "other@ascap.al", "numriLendeve": 2,
            "lendet": ["Matematikë", "Gjuhë Shqipe"],
        }, timeout=10)
        assert r.status_code == 403

    def test_me_no_header(self):
        r = requests.get(f"{API}/license/me", timeout=10)
        assert r.status_code == 401

    def test_deactivate_returns_403(self, created_license, admin_headers):
        kodi = created_license["kodi"]
        r = requests.patch(f"{API}/admin/licenses/{kodi}/toggle", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        me = requests.get(f"{API}/license/me", headers={"X-License": kodi}, timeout=10)
        assert me.status_code == 403
        # re-enable so cleanup consistent
        requests.patch(f"{API}/admin/licenses/{kodi}/toggle", headers=admin_headers, timeout=10)


# ---------- Ditar (list only; generate verified via curl earlier) ----------
class TestDitar:
    def test_list_requires_license(self):
        assert requests.get(f"{API}/ditar", timeout=10).status_code == 401

    def test_generate_requires_license(self):
        r = requests.post(f"{API}/ditar/generate", json={
            "lenda": "Matematikë", "klasa": "Klasa 5", "data": "01.01.2026", "tema": "x",
        }, timeout=10)
        assert r.status_code == 401

    def test_generate_subject_not_in_license(self, created_license):
        # created_license is activated above with Matematikë + Gjuhë Shqipe
        r = requests.post(f"{API}/ditar/generate", json={
            "lenda": "Anglisht", "klasa": "Klasa 5", "data": "01.01.2026", "tema": "test",
        }, headers={"X-License": created_license["kodi"]}, timeout=15)
        assert r.status_code == 403

    def test_generate_missing_input(self, created_license):
        r = requests.post(f"{API}/ditar/generate", json={
            "lenda": "Matematikë", "klasa": "Klasa 5", "data": "01.01.2026", "tema": "",
        }, headers={"X-License": created_license["kodi"]}, timeout=15)
        assert r.status_code == 400
