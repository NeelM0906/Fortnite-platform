"use client";
import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Plot from "react-plotly.js";

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [profile, setProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ username: "", name: "", dob: "", email: "" });
  const [profileMsg, setProfileMsg] = useState("");
  const [mapCode, setMapCode] = useState("");
  const [scrape, setScrape] = useState<any>(null);
  const [scrapeMsg, setScrapeMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(res => {
        if (res.profile) {
          setProfile(res.profile);
          setProfileForm({
            username: res.profile.username || "",
            name: res.profile.name || "",
            dob: res.profile.dob || "",
            email: res.profile.email || ""
          });
        }
      });
  }, []);

  // Handle profile form change
  function handleProfileChange(e: any) {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  }

  // Update profile
  async function updateProfile(e: any) {
    e.preventDefault();
    setProfileMsg("");
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileForm)
    });
    const data = await res.json();
    if (data.profile) {
      setProfile(data.profile);
      setProfileMsg("Profile updated!");
    } else {
      setProfileMsg(data.error || "Failed to update profile");
    }
  }

  // Handle map code submit
  async function handleScrape(e: any) {
    e.preventDefault();
    setScrapeMsg("");
    setLoading(true);
    setScrape(null);
    const res = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mapCode })
    });
    const data = await res.json();
    setLoading(false);
    if (data.data) {
      setScrape(data.data);
    } else {
      setScrapeMsg(data.error || "Failed to fetch map data");
    }
  }

  // Extract chart/table data
  let chart = null, table = null, stats = null, meta = null;
  if (scrape) {
    const d = Array.isArray(scrape) ? scrape[0] : scrape;
    meta = d;
    stats = d.player_stats;
    const tableRows = d.table_rows || [];
    const times = tableRows.map((r: any) => r.time);
    const peaks = tableRows.map((r: any) => parseInt((r.peak||'0').replace(/,/g, '')));
    const avgs = tableRows.map((r: any) => parseInt((r.average||'0').replace(/,/g, '')));
    chart = (
      <Plot
        data={[
          { x: times, y: peaks, type: 'scatter', mode: 'lines+markers', name: 'Peak' },
          { x: times, y: avgs, type: 'scatter', mode: 'lines+markers', name: 'Average' }
        ]}
        layout={{ title: 'Player Count Over Time', xaxis: { title: 'Time' }, yaxis: { title: 'Players' } }}
        style={{ width: '100%', height: 400 }}
      />
    );
    table = (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 16 }}>
        <thead>
          <tr>
            <th>Time</th><th>Peak</th><th>Average</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((r: any, i: number) => (
            <tr key={i}>
              <td>{r.time}</td>
              <td>{r.peak}</td>
              <td>{r.average}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: "auto", padding: 32 }}>
      <h2>Dashboard</h2>
      <h3>Profile</h3>
      <form onSubmit={updateProfile} style={{ marginBottom: 24 }}>
        <input name="name" placeholder="Name" value={profileForm.name} onChange={handleProfileChange} style={{ marginRight: 8 }} />
        <input name="dob" placeholder="Date of Birth" value={profileForm.dob} onChange={handleProfileChange} style={{ marginRight: 8 }} />
        <input name="username" placeholder="Username" value={profileForm.username} onChange={handleProfileChange} style={{ marginRight: 8 }} />
        <input name="email" placeholder="Email" value={profileForm.email} onChange={handleProfileChange} style={{ marginRight: 8 }} />
        <button type="submit">Update</button>
      </form>
      {profileMsg && <div style={{ color: 'green', marginBottom: 16 }}>{profileMsg}</div>}
      <h3>Scrape Fortnite Map</h3>
      <form onSubmit={handleScrape} style={{ marginBottom: 24 }}>
        <input name="mapCode" placeholder="Map Code" value={mapCode} onChange={e => setMapCode(e.target.value)} style={{ marginRight: 8 }} />
        <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Fetch'}</button>
      </form>
      {scrapeMsg && <div style={{ color: 'red', marginBottom: 16 }}>{scrapeMsg}</div>}
      {meta && (
        <div style={{ marginBottom: 24 }}>
          <h4>Map Info</h4>
          <ul>
            <li><b>Code:</b> {meta.code}</li>
            <li><b>Title:</b> {meta.title}</li>
            <li><b>Description:</b> {meta.description}</li>
            <li><b>Creator:</b> {meta.creator}</li>
            <li><b>Creator Code:</b> {meta.creator_code || meta.creatorCode}</li>
            <li><b>Published Date:</b> {meta.published_date || meta.publishedDate}</li>
            <li><b>Tags:</b> {(meta.tags || []).join(', ')}</li>
            <li><b>Version:</b> {meta.version}</li>
          </ul>
        </div>
      )}
      {stats && (
        <div style={{ marginBottom: 24 }}>
          <h4>Player Stats</h4>
          <ul>
            {stats.map((s: any, i: number) => (
              <li key={i}><b>{s.stat_label}:</b> {s.stat_value}</li>
            ))}
          </ul>
        </div>
      )}
      {chart}
      {table}
    </div>
  );
}
