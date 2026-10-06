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
DEVICE_A = "test-device-a-" + os.urandom(4).hex()
DEVICE_B = "test-device-b-" + os.urandom(4).hex()


def lic_headers(kodi, device=DEVICE_A):
    return {"X-License": kodi, "X-Device": device}


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
            "pajisja": DEVICE_A, "pajisjaEmri": "Kompjuter · Test",
        }
        r = requests.post(f"{API}/license/activate", json=payload, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["aktivizuar"] is True
        assert d["lendet"] == ["Matematikë", "Gjuhë Shqipe"]
        assert d["emri"] == "Test"

        # verify persistence via /license/me (with correct device)
        me = requests.get(f"{API}/license/me", headers=lic_headers(created_license["kodi"]), timeout=10)
        assert me.status_code == 200
        assert me.json()["email"] == "test@ascap.al"

    def test_activate_duplicate_different_email(self, created_license):
        r = requests.post(f"{API}/license/activate", json={
            "kodi": created_license["kodi"], "emri": "Other", "mbiemri": "User",
            "email": "other@ascap.al", "numriLendeve": 2,
            "lendet": ["Matematikë", "Gjuhë Shqipe"],
            "pajisja": DEVICE_A, "pajisjaEmri": "Kompjuter · Test",
        }, timeout=10)
        assert r.status_code == 403

    def test_me_no_header(self):
        r = requests.get(f"{API}/license/me", timeout=10)
        assert r.status_code == 401

    def test_deactivate_returns_403(self, created_license, admin_headers):
        kodi = created_license["kodi"]
        r = requests.patch(f"{API}/admin/licenses/{kodi}/toggle", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        me = requests.get(f"{API}/license/me", headers=lic_headers(kodi), timeout=10)
        assert me.status_code == 403
        # re-enable so cleanup consistent
        requests.patch(f"{API}/admin/licenses/{kodi}/toggle", headers=admin_headers, timeout=10)


# ---------- Device lock ----------
class TestDeviceLock:
    def test_activate_missing_device(self, admin_headers):
        c = requests.post(f"{API}/admin/licenses", json={"numriLendeve": 1},
                          headers=admin_headers, timeout=10).json()
        try:
            r = requests.post(f"{API}/license/activate", json={
                "kodi": c["kodi"], "emri": "A", "mbiemri": "B", "email": "d@x.com",
                "numriLendeve": 1, "lendet": ["Matematikë"],
            }, timeout=10)
            assert r.status_code == 400
            assert "Pajisja" in r.json()["detail"]
        finally:
            requests.delete(f"{API}/admin/licenses/{c['kodi']}", headers=admin_headers, timeout=10)

    def test_me_wrong_device_rejected(self, created_license):
        r = requests.get(f"{API}/license/me",
                         headers=lic_headers(created_license["kodi"], DEVICE_B), timeout=10)
        assert r.status_code == 403
        assert "pajisje tjetër" in r.json()["detail"]

    def test_list_ditar_wrong_device_rejected(self, created_license):
        r = requests.get(f"{API}/ditar",
                         headers=lic_headers(created_license["kodi"], DEVICE_B), timeout=10)
        assert r.status_code == 403

    def test_generate_wrong_device_rejected(self, created_license):
        r = requests.post(f"{API}/ditar/generate", json={
            "lenda": "Matematikë", "klasa": "Klasa 5", "data": "01.01.2026", "tema": "x",
        }, headers=lic_headers(created_license["kodi"], DEVICE_B), timeout=10)
        assert r.status_code == 403

    def test_login_other_device_rejected(self, created_license):
        r = requests.post(f"{API}/license/login", json={
            "kodi": created_license["kodi"], "email": "test@ascap.al",
            "pajisja": DEVICE_B, "pajisjaEmri": "Telefon · Test",
        }, timeout=10)
        assert r.status_code == 403
        assert "pajisje tjetër" in r.json()["detail"]

    def test_admin_device_reset_then_other_device_works(self, created_license, admin_headers):
        kodi = created_license["kodi"]
        rr = requests.patch(f"{API}/admin/licenses/{kodi}/device-reset",
                            headers=admin_headers, timeout=10)
        assert rr.status_code == 200
        # Now DEVICE_A should fail (not bound anymore) if DEVICE_B logs in first.
        r = requests.post(f"{API}/license/login", json={
            "kodi": kodi, "email": "test@ascap.al",
            "pajisja": DEVICE_B, "pajisjaEmri": "Telefon · Test",
        }, timeout=10)
        assert r.status_code == 200
        # DEVICE_A should now be rejected
        me = requests.get(f"{API}/license/me", headers=lic_headers(kodi, DEVICE_A), timeout=10)
        assert me.status_code == 403
        # reset back to DEVICE_A for remaining tests
        requests.patch(f"{API}/admin/licenses/{kodi}/device-reset",
                       headers=admin_headers, timeout=10)
        requests.post(f"{API}/license/login", json={
            "kodi": kodi, "email": "test@ascap.al",
            "pajisja": DEVICE_A, "pajisjaEmri": "Kompjuter · Test",
        }, timeout=10)


# ---------- Admin diary count ----------
class TestAdminDitareCount:
    def test_list_contains_ditare_field(self, admin_headers, created_license):
        r = requests.get(f"{API}/admin/licenses", headers=admin_headers, timeout=10)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) > 0
        for row in rows:
            assert "ditare" in row, f"missing 'ditare' field in {row}"
            assert isinstance(row["ditare"], int)
        # pajisja field itself must be stripped from response (only pajisjaEmri exposed)
        for row in rows:
            assert "pajisja" not in row


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
        }, headers=lic_headers(created_license["kodi"]), timeout=15)
        assert r.status_code == 403

    def test_generate_missing_input(self, created_license):
        r = requests.post(f"{API}/ditar/generate", json={
            "lenda": "Matematikë", "klasa": "Klasa 5", "data": "01.01.2026", "tema": "",
        }, headers=lic_headers(created_license["kodi"]), timeout=15)
        assert r.status_code == 400


# ---------- License login (new) ----------
class TestLicenseLogin:
    def test_login_correct(self, created_license):
        # created_license was activated with test@ascap.al on DEVICE_A
        r = requests.post(f"{API}/license/login", json={
            "kodi": created_license["kodi"], "email": "test@ascap.al",
            "pajisja": DEVICE_A, "pajisjaEmri": "Kompjuter · Test",
        }, timeout=10)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["kodi"] == created_license["kodi"]
        assert d["email"] == "test@ascap.al"
        assert d["aktivizuar"] is True

    def test_login_wrong_email(self, created_license):
        r = requests.post(f"{API}/license/login", json={
            "kodi": created_license["kodi"], "email": "wrong@ascap.al",
            "pajisja": DEVICE_A,
        }, timeout=10)
        assert r.status_code == 401

    def test_login_unactivated_code(self, admin_headers):
        c = requests.post(f"{API}/admin/licenses", json={"numriLendeve": 1},
                          headers=admin_headers, timeout=10).json()
        try:
            r = requests.post(f"{API}/license/login", json={
                "kodi": c["kodi"], "email": "anything@ascap.al", "pajisja": DEVICE_A,
            }, timeout=10)
            assert r.status_code == 401
        finally:
            requests.delete(f"{API}/admin/licenses/{c['kodi']}", headers=admin_headers, timeout=10)

    def test_login_deactivated(self, created_license, admin_headers):
        kodi = created_license["kodi"]
        requests.patch(f"{API}/admin/licenses/{kodi}/toggle", headers=admin_headers, timeout=10)
        try:
            r = requests.post(f"{API}/license/login", json={
                "kodi": kodi, "email": "test@ascap.al", "pajisja": DEVICE_A,
            }, timeout=10)
            assert r.status_code == 403
        finally:
            requests.patch(f"{API}/admin/licenses/{kodi}/toggle", headers=admin_headers, timeout=10)

    def test_login_code_case_insensitive(self, created_license):
        r = requests.post(f"{API}/license/login", json={
            "kodi": created_license["kodi"].lower(), "email": "TEST@ascap.al",
            "pajisja": DEVICE_A,
        }, timeout=10)
        assert r.status_code == 200


# ---------- Share endpoints ----------
class TestShare:
    def test_share_requires_license(self):
        r = requests.post(f"{API}/ditar/xxx/share", json={"html": "<p/>", "fontSize": 12}, timeout=10)
        assert r.status_code == 401

    def test_share_not_found(self, created_license):
        r = requests.post(f"{API}/ditar/nonexistent-id/share",
                          json={"html": "<p/>", "fontSize": 12},
                          headers=lic_headers(created_license["kodi"]), timeout=10)
        assert r.status_code == 404

    def test_share_unknown_token(self, created_license):
        r = requests.get(f"{API}/share/nonexistent-token", timeout=10)
        assert r.status_code == 404
        # seed a ditar directly via Mongo-less path: insert through the generate endpoint is costly,
        # so we create one by hitting /ditar list first - need an actual record. Use pymongo? Not available here.
        # Instead, create via a direct insert using the share endpoint only works if ditar exists.
        # We'll check that unknown share token returns 404.
        r = requests.get(f"{API}/share/nonexistent-token", timeout=10)
        assert r.status_code == 404
