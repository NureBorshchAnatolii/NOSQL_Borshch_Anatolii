import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import api from "../../api/axios";
import { useAuth } from "../hooks/useAuth";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const otherUserIcon = new L.Icon({
  iconUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png",
  iconRetinaUrl:
    "https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function Recenter({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position)
      map.flyTo(position, Math.max(map.getZoom(), 12), { duration: 0.6 });
  }, [position, map]);
  return null;
}

const formatDateInput = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
  });

  const [loc, setLoc] = useState({
    lng: "",
    lat: "",
    city: "",
    country: "",
  });

  const [profileMsg, setProfileMsg] = useState(null);
  const [locMsg, setLocMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLoc, setSavingLoc] = useState(false);
  const [otherUsers, setOtherUsers] = useState([]);

  const [routeTargetId, setRouteTargetId] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const loadOtherUsers = async () => {
    try {
      const { data } = await api.get("/geo/users");
      setOtherUsers(Array.isArray(data?.users) ? data.users : []);
    } catch {
      setOtherUsers([]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/geo/users")
      .then(({ data }) => {
        if (cancelled) return;
        setOtherUsers(Array.isArray(data?.users) ? data.users : []);
      })
      .catch(() => {
        if (!cancelled) setOtherUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [prevUserId, setPrevUserId] = useState(null);
  if (user && prevUserId !== user._id) {
    setPrevUserId(user._id);
    setProfile({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      birthDate: formatDateInput(user.birthDate),
    });
    if (user.location?.coordinates?.length === 2) {
      setLoc({
        lng: String(user.location.coordinates[0]),
        lat: String(user.location.coordinates[1]),
        city: user.location.city || "",
        country: user.location.country || "",
      });
    } else {
      setLoc({ lng: "", lat: "", city: "", country: "" });
    }
  }

  const markerPos = useMemo(() => {
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return [lat, lng];
  }, [loc.lat, loc.lng]);

  const initialCenter = markerPos || [50.4501, 30.5234];

  const setProfileField = (k) => (e) =>
    setProfile((p) => ({ ...p, [k]: e.target.value }));

  const setLocField = (k) => (e) =>
    setLoc((l) => ({ ...l, [k]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!user?._id) return;
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      const payload = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        birthDate: profile.birthDate || null,
      };
      await api.put(`/users/${user._id}`, payload);
      await refreshUser?.();
      setProfileMsg({ type: "success", text: "Profile updated" });
    } catch (err) {
      setProfileMsg({
        type: "error",
        text: err.response?.data?.message || "Update failed",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const saveLocation = async (e) => {
    e.preventDefault();
    setLocMsg(null);
    const lat = parseFloat(loc.lat);
    const lng = parseFloat(loc.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      setLocMsg({ type: "error", text: "Latitude and longitude are required" });
      return;
    }
    setSavingLoc(true);
    try {
      await api.put("/geo/me/location", {
        lat,
        lng,
        city: loc.city || null,
        country: loc.country || null,
      });
      await refreshUser?.();
      await loadOtherUsers();
      setLocMsg({ type: "success", text: "Location saved" });
    } catch (err) {
      setLocMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to save location",
      });
    } finally {
      setSavingLoc(false);
    }
  };

  const clearLocation = async () => {
    setLocMsg(null);
    setSavingLoc(true);
    try {
      await api.delete("/geo/me/location");
      setLoc({ lng: "", lat: "", city: "", country: "" });
      await refreshUser?.();
      await loadOtherUsers();
      setLocMsg({ type: "success", text: "Location cleared" });
    } catch (err) {
      setLocMsg({
        type: "error",
        text: err.response?.data?.message || "Failed to clear location",
      });
    } finally {
      setSavingLoc(false);
    }
  };

  const useBrowserGeo = () => {
    if (!navigator.geolocation) {
      setLocMsg({
        type: "error",
        text: "Geolocation is not supported by this browser",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoc((l) => ({
          ...l,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
      },
      (err) => setLocMsg({ type: "error", text: err.message }),
    );
  };

  const haversineKm = (a, b) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    return 2 * R * Math.asin(Math.sqrt(h));
  };

  const buildRouteTo = async (target) => {
    setRouteError(null);
    if (!markerPos) {
      setRouteError("Set your own location first");
      return;
    }
    if (!target?.location?.coordinates) return;

    const [tLng, tLat] = target.location.coordinates;
    const from = markerPos;
    const to = [tLat, tLng];

    setRouteTargetId(target._id);
    setRouteLoading(true);

    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        const leg = data?.routes?.[0];
        if (leg?.geometry?.coordinates?.length) {
          const coords = leg.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ]);
          setRoute({
            coords,
            distance: leg.distance,
            duration: leg.duration,
            mode: "driving",
          });
          setRouteLoading(false);
          return;
        }
      }
    } catch {
      // ignore
    }

    const km = haversineKm(from, to);
    setRoute({
      coords: [from, to],
      distance: km * 1000,
      duration: null,
      mode: "straight",
    });
    setRouteLoading(false);
  };

  const clearRoute = () => {
    setRoute(null);
    setRouteTargetId(null);
    setRouteError(null);
  };

  if (routeTargetId) {
    const target = otherUsers.find((u) => u._id === routeTargetId);
    if (!target || !markerPos) {
      setRoute(null);
      setRouteTargetId(null);
    }
  }

  const formatDistance = (m) => {
    if (m == null) return "";
    if (m < 1000) return `${Math.round(m)} m`;
    return `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
  };
  const formatDuration = (s) => {
    if (s == null) return "";
    const min = Math.round(s / 60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const r = min % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: "32px 24px", maxWidth: 960 }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>My profile</h1>
      <p style={{ color: "var(--ink-2)", marginBottom: 28 }}>
        Manage your personal data and where you are on the map.
      </p>

      <div
        style={{
          display: "grid",
          gap: 24,
          gridTemplateColumns: "1fr",
          alignItems: "start",
        }}
      >
        <div className="card">
          <h2 style={{ fontSize: "1.25rem", marginBottom: 16 }}>
            Personal info
          </h2>
          {profileMsg && (
            <div
              className={`alert alert-${profileMsg.type}`}
              style={{ marginBottom: 16 }}
            >
              {profileMsg.text}
            </div>
          )}
          <form
            onSubmit={saveProfile}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="field">
                <label>First name</label>
                <input
                  className="input"
                  value={profile.firstName}
                  onChange={setProfileField("firstName")}
                  required
                />
              </div>
              <div className="field">
                <label>Last name</label>
                <input
                  className="input"
                  value={profile.lastName}
                  onChange={setProfileField("lastName")}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" value={user.email || ""} disabled />
            </div>
            <div className="field">
              <label>Birth date</label>
              <input
                className="input"
                type="date"
                value={profile.birthDate}
                onChange={setProfileField("birthDate")}
              />
            </div>
            <div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <h2 style={{ fontSize: "1.25rem" }}>Location</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={useBrowserGeo}
              >
                Use my location
              </button>
              {markerPos && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearLocation}
                  disabled={savingLoc}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {locMsg && (
            <div
              className={`alert alert-${locMsg.type}`}
              style={{ marginBottom: 16 }}
            >
              {locMsg.text}
            </div>
          )}

          <div
            style={{
              height: 380,
              marginBottom: 16,
              borderRadius: 8,
              overflow: "hidden",
              border: "1px solid var(--line)",
            }}
          >
            <MapContainer
              center={initialCenter}
              zoom={markerPos ? 12 : 4}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />
              <ClickPicker
                onPick={({ lat, lng }) =>
                  setLoc((l) => ({
                    ...l,
                    lat: lat.toFixed(6),
                    lng: lng.toFixed(6),
                  }))
                }
              />
              {markerPos && (
                <>
                  <Recenter position={markerPos} />
                  <Marker position={markerPos}>
                    <Popup>
                      <strong>
                        {user.firstName} {user.lastName}
                      </strong>
                      <br />
                      <em>(you)</em>
                      <br />
                      {loc.city || loc.country
                        ? [loc.city, loc.country].filter(Boolean).join(", ")
                        : `${markerPos[0].toFixed(4)}, ${markerPos[1].toFixed(4)}`}
                    </Popup>
                  </Marker>
                </>
              )}

              {otherUsers
                .filter(
                  (u) =>
                    u._id !== user._id &&
                    Array.isArray(u.location?.coordinates) &&
                    u.location.coordinates.length === 2,
                )
                .map((u) => {
                  const [lng, lat] = u.location.coordinates;
                  const isRouteTarget = routeTargetId === u._id;
                  return (
                    <Marker
                      key={u._id}
                      position={[lat, lng]}
                      icon={otherUserIcon}
                    >
                      <Popup>
                        <strong>
                          {u.firstName} {u.lastName}
                        </strong>
                        <br />
                        {u.location.city || u.location.country
                          ? [u.location.city, u.location.country]
                              .filter(Boolean)
                              .join(", ")
                          : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}
                        {markerPos && (
                          <>
                            <br />
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              style={{ marginTop: 6 }}
                              onClick={() =>
                                isRouteTarget ? clearRoute() : buildRouteTo(u)
                              }
                              disabled={routeLoading}
                            >
                              {isRouteTarget
                                ? "Hide route"
                                : routeLoading
                                  ? "Building…"
                                  : "Route from me"}
                            </button>
                          </>
                        )}
                      </Popup>
                    </Marker>
                  );
                })}

              {route?.coords?.length > 1 && (
                <Polyline
                  positions={route.coords}
                  pathOptions={{
                    color: route.mode === "straight" ? "#888" : "#2563eb",
                    weight: 4,
                    opacity: 0.85,
                    dashArray: route.mode === "straight" ? "8 8" : null,
                  }}
                />
              )}
            </MapContainer>
          </div>

          {(route || routeError) && (
            <div
              className={`alert alert-${routeError ? "error" : "success"}`}
              style={{
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span>
                {routeError
                  ? routeError
                  : (() => {
                      const target = otherUsers.find(
                        (u) => u._id === routeTargetId,
                      );
                      const name = target
                        ? `${target.firstName} ${target.lastName}`
                        : "user";
                      const dist = formatDistance(route.distance);
                      const dur = formatDuration(route.duration);
                      const kind =
                        route.mode === "driving"
                          ? "driving route"
                          : "straight line";
                      return `${kind} to ${name}: ${dist}${dur ? ` · ~${dur}` : ""}`;
                    })()}
              </span>
              {(route || routeError) && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={clearRoute}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <form
            onSubmit={saveLocation}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="field">
                <label>Latitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={loc.lat}
                  onChange={setLocField("lat")}
                  placeholder="50.4501"
                />
              </div>
              <div className="field">
                <label>Longitude</label>
                <input
                  className="input"
                  type="number"
                  step="any"
                  value={loc.lng}
                  onChange={setLocField("lng")}
                  placeholder="30.5234"
                />
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div className="field">
                <label>City</label>
                <input
                  className="input"
                  value={loc.city}
                  onChange={setLocField("city")}
                  placeholder="Kyiv"
                />
              </div>
              <div className="field">
                <label>Country</label>
                <input
                  className="input"
                  value={loc.country}
                  onChange={setLocField("country")}
                  placeholder="Ukraine"
                />
              </div>
            </div>
            <div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={savingLoc}
              >
                {savingLoc ? "Saving…" : "Save location"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
