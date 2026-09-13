import { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Ambulance, 
  Bell, 
  CheckCircle, 
  FileText, 
  Lock, 
  Pill, 
  QrCode, 
  ShieldAlert, 
  UserCheck, 
  Users, 
  Wifi, 
  WifiOff,
  User,
  RefreshCw
} from 'lucide-react';

// ==========================================
// MOCK DATABASE & LOCAL CACHE SIMULATION
// ==========================================

const MOCK_PATIENT_DATA = {
  id: "PATIENT-9901",
  name: "Ramesh Kumar",
  dob: "1974-05-12",
  gender: "Male",
  bloodGroup: "O+",
  allergies: ["Penicillin", "Sulfa Drugs"],
  emergencyContact: "+91 98765 43210 (Wife - Sunita)",
  medicalHistory: [
    { type: "Diagnosis", title: "Hypertension", date: "2024-01-15", doctor: "Dr. Sharma" },
    { type: "Lab Report", title: "Lipid Profile - Borderline High", date: "2024-02-10", doctor: "Metropolis Lab" }
  ],
  ongoingMedication: [
    { name: "Ecosprin 75mg", generic: "Aspirin", dose: "1 daily", prescribedBy: "Dr. Sharma (Cardiology)" },
    { name: "Metformin 500mg", generic: "Metformin", dose: "2 daily", prescribedBy: "Dr. Patel (General)" }
  ],
  treatments: [
    { title: "Cardiac Monitoring", status: "Ongoing", outcome: "Stable BP levels over 3 months" }
  ],
  revokedDoctors: [] // Stores list of clinics with revoked access
};

const KNOWN_DRUG_WARNINGS = [
  { input: "brufen", generic: "Ibuprofen", risk: "Drug Incompatibility: Severe risk of GI bleeding when combined with Aspirin (Ecosprin)." },
  { input: "penicillin", generic: "Penicillin", risk: "Allergy Alert: Patient record flags severe Penicillin allergy!" },
  { input: "disprin", generic: "Aspirin", risk: "Duplicate Medication: Patient is already taking Aspirin under brand name Ecosprin." }
];

export default function UnifiedHealthGrid() {
  // Global & Connectivity State
  const [activeRole, setActiveRole] = useState("PATIENT"); // "PATIENT" or "DOCTOR"
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Patient Flow State
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [patientData, setPatientData] = useState(MOCK_PATIENT_DATA);
  const [showEmergencyRouting, setShowEmergencyRouting] = useState(false);
  
  // Doctor Flow State
  const [scannedPatientId, setScannedPatientId] = useState("PATIENT-9901");
  const [activeRecord, setActiveRecord] = useState(null);
  const [newMedInput, setNewMedInput] = useState("");
  const [activeWarning, setActiveWarning] = useState(null);
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [scanError, setScanError] = useState("");

  // Connectivity Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync / Cache Patient Data for Offline Access
  useEffect(() => {
    if (isOnline) {
      localStorage.setItem("OFFLINE_PATIENT_CACHE", JSON.stringify(patientData));
    }
  }, [patientData, isOnline]);

  // Doctor Action: Add Patient record by QR
  const handleDoctorScan = () => {
    setFollowUpSaved(false);
    setActiveWarning(null);
    setScanError("");

    if (scannedPatientId.trim().toUpperCase() !== patientData.id) {
      setActiveRecord(null);
      setScanError("Patient record not found. Check the QR code or patient ID and try again.");
      return;
    }

    if (patientData.revokedDoctors?.includes("Dr. Sharma")) {
      setActiveRecord(null);
      setScanError("Access denied. The patient has revoked Dr. Sharma's access to this medical record.");
      return;
    }

    if (isOnline) {
      setActiveRecord(patientData);
    } else {
      // Offline Flow: Show cached summarized patient data
      const cached = localStorage.getItem("OFFLINE_PATIENT_CACHE");
      if (cached) {
        setActiveRecord(JSON.parse(cached));
      } else {
        alert("No cached patient data found for offline viewing.");
      }
    }
  };

  // Doctor Action: Check Drug Incompatibility & Allergy Warnings
  const handleAddPrescription = (e) => {
    e.preventDefault();
    if (!newMedInput) return;

    const query = newMedInput.trim().toLowerCase();
    const match = KNOWN_DRUG_WARNINGS.find(w => w.input === query || w.generic.toLowerCase() === query);

    if (match) {
      setActiveWarning(match.risk);
    } else {
      setActiveWarning(null);
      // Save & Update Record Flow
      const updatedMeds = [
        ...activeRecord.ongoingMedication,
        { name: newMedInput, generic: newMedInput, dose: "As directed", prescribedBy: "Current Clinic" }
      ];
      const updatedRecord = { ...activeRecord, ongoingMedication: updatedMeds };
      setActiveRecord(updatedRecord);
      setPatientData(updatedRecord); // Syncs back to patient dashboard
      setFollowUpSaved(true);
      setNewMedInput("");
    }
  };

  // Patient Action: Revoke Clinic / Doctor Access
  const toggleRevokeAccess = (doctorName) => {
    const current = patientData.revokedDoctors || [];
    const updated = current.includes(doctorName) 
      ? current.filter(d => d !== doctorName)
      : [...current, doctorName];
    
    setPatientData({ ...patientData, revokedDoctors: updated });
    if (updated.includes(doctorName)) {
      setActiveRecord(null);
      setActiveWarning(null);
      setFollowUpSaved(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-6">
      
      {/* Dynamic Top Bar & Flow Switcher */}
      <header className="max-w-7xl mx-auto mb-6 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-600 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Unified Health Grid</h1>
            <p className="text-xs text-slate-400">Flowchart Engine Prototype</p>
          </div>
        </div>

        {/* User Flow Role Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setActiveRole("PATIENT")}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-md font-medium transition ${
              activeRole === "PATIENT" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> Patient / Family Flow
          </button>
          <button 
            onClick={() => setActiveRole("DOCTOR")}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-md font-medium transition ${
              activeRole === "DOCTOR" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="w-4 h-4" /> Doctor / Clinic Flow
          </button>
        </div>

        {/* Network & Offline Cache Indicator */}
        <div className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border ${
          isOnline ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800' : 'bg-amber-950/80 text-amber-400 border-amber-800'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isOnline ? "Online Sync Active" : "Offline Cache Mode"}</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. PATIENT / FAMILY USER FLOW */}
      {/* ========================================================================= */}
      {activeRole === "PATIENT" && (
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Top Login & First Time Controls */}
          <div className="bg-purple-950/30 border border-purple-800/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-semibold text-purple-200">Patient / Family User Portal</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isFirstTime} 
                  onChange={(e) => setIsFirstTime(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600"
                />
                Simulate "First Time Login?"
              </label>
            </div>
          </div>

          {/* Path A: First Time Login -> Complete Profile */}
          {isFirstTime ? (
            <div className="bg-slate-900 border border-purple-500/50 rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-purple-300 flex items-center gap-2">
                <UserCheck className="w-5 h-5" /> First-Time Registration: Complete Profile
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Personal Details (Name, DOB, Gender)</label>
                  <input type="text" value={patientData.name} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200" disabled />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Emergency Contact Number</label>
                  <input type="text" value={patientData.emergencyContact} className="w-full bg-slate-950 border border-slate-800 p-2 rounded text-slate-200" disabled />
                </div>
              </div>
              <button 
                onClick={() => setIsFirstTime(false)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded font-medium transition"
              >
                Save & Continue to Patient Dashboard
              </button>
            </div>
          ) : (
            /* Path B: Patient / Family Dashboard */
            <>
              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Complete Profile Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <User className="w-4 h-4" /> Complete Profile
                  </h3>
                  <div className="text-xs space-y-2 text-slate-300">
                    <p><span className="text-slate-500">Name:</span> <strong>{patientData.name}</strong></p>
                    <p><span className="text-slate-500">DOB / Gender:</span> {patientData.dob} ({patientData.gender})</p>
                    <p><span className="text-slate-500">Blood Group:</span> <span className="text-rose-400 font-bold">{patientData.bloodGroup}</span></p>
                    <p><span className="text-slate-500">Allergies:</span> {patientData.allergies.join(", ")}</p>
                    <p><span className="text-slate-500">Emergency Contact:</span> {patientData.emergencyContact}</p>
                  </div>
                </div>

                {/* 2. Medical Records Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <FileText className="w-4 h-4" /> Medical Records
                  </h3>
                  <div className="space-y-2 text-xs">
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase">Diagnosis & Lab Reports</h4>
                    {patientData.medicalHistory.map((rec, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800 flex justify-between">
                        <div>
                          <p className="font-semibold text-slate-200">{rec.title}</p>
                          <p className="text-[10px] text-slate-500">{rec.doctor}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">{rec.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Treatments Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Pill className="w-4 h-4" /> Ongoing Treatments
                  </h3>
                  <div className="space-y-2 text-xs">
                    {patientData.ongoingMedication.map((med, i) => (
                      <div key={i} className="bg-slate-950 p-2 rounded border border-slate-800">
                        <p className="font-semibold text-slate-200">{med.name} ({med.generic})</p>
                        <p className="text-[10px] text-slate-500">{med.dose} • Prescribed by {med.prescribedBy}</p>
                      </div>
                    ))}
                    {patientData.treatments.map((tr, i) => (
                      <div key={i} className="bg-purple-950/30 border border-purple-800/40 p-2 rounded text-[11px]">
                        <p className="font-bold text-purple-300">Past Outcome: {tr.outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Notification & Reminders Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-amber-400" />
                  <div>
                    <h4 className="font-bold text-slate-200">Notifications & Reminders</h4>
                    <p className="text-slate-400">Medicine Reminder: Metformin due at 8:00 PM • Checkup Update: Cardiology follow-up scheduled.</p>
                  </div>
                </div>
              </div>

              {/* Patient-controlled doctor access */}
              <div className="bg-slate-900 border border-cyan-800/60 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Manage Doctor Access</h3>
                    <p className="text-xs text-slate-400 mt-1">Give or revoke access to your medical history at any time.</p>
                    <p className="text-xs mt-2">
                      <span className="text-slate-500">Dr. Sharma (Cardiology): </span>
                      <span className={patientData.revokedDoctors?.includes("Dr. Sharma") ? "text-rose-400" : "text-emerald-400"}>
                        {patientData.revokedDoctors?.includes("Dr. Sharma") ? "Access revoked" : "Access granted"}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => toggleRevokeAccess("Dr. Sharma")}
                  className={`text-xs px-4 py-2 rounded font-medium transition ${
                    patientData.revokedDoctors?.includes("Dr. Sharma")
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800"
                  }`}
                >
                  {patientData.revokedDoctors?.includes("Dr. Sharma") ? "Grant Access" : "Revoke Access"}
                </button>
              </div>

              {/* Decision Node: Need Emergency Care? */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-200">Do you need emergency care?</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowEmergencyRouting(false)}
                      className={`text-xs px-4 py-2 rounded font-medium transition ${!showEmergencyRouting ? 'bg-slate-800 text-slate-200' : 'text-slate-400'}`}
                    >
                      No (Continue using app)
                    </button>
                    <button 
                      onClick={() => setShowEmergencyRouting(true)}
                      className={`text-xs px-4 py-2 rounded font-medium transition ${showEmergencyRouting ? 'bg-rose-600 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}
                    >
                      Yes (Trigger Emergency Routing)
                    </button>
                  </div>
                </div>

                {/* Emergency Hospital Routing Box */}
                {showEmergencyRouting && (
                  <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-5 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <Ambulance className="w-6 h-6 text-rose-400" />
                      <div>
                        <h4 className="font-bold text-rose-200">Emergency Hospital Routing Active</h4>
                        <p className="text-xs text-slate-300">Contacting nearby hospitals to check occupancy % and live available ambulances.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950 p-3 rounded border border-slate-800">
                        <p className="font-bold text-slate-200">District Hospital Palghar (Recommended)</p>
                        <p className="text-slate-400">Live Occupancy: 78% (3 ICU Beds Open)</p>
                        <p className="text-emerald-400 font-semibold mt-1">Ambulance #MH-04-1029 Dispatched • ETA: 12 Mins</p>
                      </div>
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 opacity-60">
                        <p className="font-bold text-slate-200">Metro Trauma Center</p>
                        <p className="text-slate-400">Live Occupancy: 96% (Full Capacity)</p>
                        <p className="text-rose-400 text-[11px] mt-1">Bypassed due to high occupancy delay</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DOCTOR / CLINIC USER FLOW */}
      {/* ========================================================================= */}
      {activeRole === "DOCTOR" && (
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Doctor Header & Login State */}
          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm font-bold text-amber-200">Doctor / Clinic Dashboard</h2>
                <p className="text-xs text-slate-400">Manage Patients • View Notifications • Check Occupancy & Ambulance Availability</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full">Doctor Authenticated</span>
          </div>

          {/* Action Node: Add Patient Record by QR */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <QrCode className="w-6 h-6 text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-200">Scan Patient QR Code</h3>
                <p className="text-xs text-slate-400">Simulate reading physical/digital QR card for lookup.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={scannedPatientId} 
                onChange={(e) => setScannedPatientId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-2 rounded outline-none"
              />
              <button 
                onClick={handleDoctorScan}
                className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4 py-2 rounded font-medium transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Read QR & Fetch Record
              </button>
            </div>
          </div>

          {scanError && (
            <div role="alert" className="bg-rose-950/60 border border-rose-800 p-3 rounded-lg text-xs text-rose-200">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {scanError}
              </div>
            </div>
          )}

          {/* Decision Node: Internet Connectivity check output */}
          {activeRecord && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Patient Record Main Panel */}
              <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                
                {/* Offline Warning Banner if internet disconnected */}
                {!isOnline && (
                  <div className="bg-amber-950/60 border border-amber-800 p-3 rounded-lg flex items-center gap-2 text-xs text-amber-200">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span><strong>Offline Mode Active:</strong> Showing cached summarized patient data based on most recent clinical visit.</span>
                  </div>
                )}

                <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{activeRecord.name} ({activeRecord.gender}, {activeRecord.dob})</h3>
                    <p className="text-xs text-slate-400">Blood Group: <span className="text-rose-400 font-bold">{activeRecord.bloodGroup}</span> • Allergies: {activeRecord.allergies.join(", ")}</p>
                  </div>
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded">Synced Record</span>
                </div>

                {/* Open Patient Record Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Medical History & Diagnoses</h4>
                    {activeRecord.medicalHistory.map((m, i) => (
                      <p key={i} className="text-slate-400">• <strong className="text-slate-200">{m.title}</strong> ({m.date})</p>
                    ))}
                  </div>
                  <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Ongoing Treatments & Meds</h4>
                    {activeRecord.ongoingMedication.map((m, i) => (
                      <p key={i} className="text-slate-400">• <strong className="text-slate-200">{m.name}</strong> ({m.generic})</p>
                    ))}
                  </div>
                </div>

                {/* Prescription Input & Drug Incompatibility Decision Node */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200">Prescribe New Medication / Add Clinical Note</h4>
                  <form onSubmit={handleAddPrescription} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Try typing 'Brufen' or 'Penicillin' to test incompatibility warning" 
                      value={newMedInput} 
                      onChange={(e) => setNewMedInput(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-xs text-slate-200 p-2 rounded flex-grow outline-none focus:border-amber-500"
                    />
                    <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white text-xs px-4 py-2 rounded font-medium transition">
                      Validate & Add
                    </button>
                  </form>

                  {/* Warning Trigger Output */}
                  {activeWarning && (
                    <div className="bg-rose-950 border border-rose-700 p-3 rounded-lg text-xs space-y-1 animate-shake">
                      <div className="flex items-center gap-2 font-bold text-rose-200">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        View Warning Triggered
                      </div>
                      <p className="text-rose-300 text-[11px]">{activeWarning}</p>
                    </div>
                  )}

                  {/* Save and Update Record / Follow-up Management */}
                  {followUpSaved && (
                    <div className="bg-emerald-950 border border-emerald-800 p-3 rounded-lg text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-300">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        Record Saved & Updated
                      </div>
                      <p className="text-emerald-400 text-[11px]">Follow-up management initialized. Changes synced to Patient Dashboard.</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}