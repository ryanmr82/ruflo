import { useState, useRef, useCallback } from "preact/hooks";

// Raid configurations
const RAIDS = {
  MC: { name: "Molten Core", finalBoss: "Ragnaros" },
  BWL: { name: "Blackwing Lair", finalBoss: "Nefarian" },
  ONY: { name: "Onyxia's Lair", finalBoss: "Onyxia" },
  ZG: { name: "Zul'Gurub", finalBoss: "Hakkar" },
  AQ20: { name: "Ruins of Ahn'Qiraj", finalBoss: "Ossirian the Unscarred" },
  AQ40: { name: "Temple of Ahn'Qiraj", finalBoss: "C'Thun" },
  NAXX: { name: "Naxxramas", finalBoss: "Kel'Thuzad" },
  KARA10: { name: "Karazhan (10)", finalBoss: "Atiesh" },
  KARA40: { name: "Karazhan (40)", finalBoss: "Prince Malchezaar" },
  EMERALD: { name: "Emerald Sanctum", finalBoss: "Solnius" },
};

const ALL_BOSSES = Object.values(RAIDS).map(r => r.finalBoss);
const PRE_RAID_BUFFER_MINUTES = 5;

interface BossDeath {
  boss: string;
  time: Date;
  line: number;
  raidType: string;
  raidName: string;
}

interface LogInfo {
  firstTime: Date | null;
  lastTime: Date | null;
  lastLine: number;
}

interface ProcessingState {
  status: "idle" | "scanning" | "ready" | "extracting" | "done" | "error";
  message: string;
  progress: number;
}

export default function LogProcessor() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [bossDeaths, setBossDeaths] = useState<BossDeath[]>([]);
  const [logInfo, setLogInfo] = useState<LogInfo>({ firstTime: null, lastTime: null, lastLine: 0 });
  const [processing, setProcessing] = useState<ProcessingState>({ status: "idle", message: "", progress: 0 });
  const [rawLines, setRawLines] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [playerName, setPlayerName] = useState<string>("");
  const [selectedRaid, setSelectedRaid] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(""); // YYYY-MM-DD format
  const [startTime, setStartTime] = useState<string>(""); // HH:MM format
  const [endMode, setEndMode] = useState<string>("");
  const [endTime, setEndTime] = useState<string>(""); // HH:MM format for custom

  // Parse log timestamp: "M/D HH:MM:SS.mmm" -> Date
  const parseLogTimestamp = (line: string): Date | null => {
    const match = line.match(/^(\d{1,2})\/(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})\.\d{3}/);
    if (match) {
      const [, month, day, hour, minute, second] = match.map(Number);
      const year = new Date().getFullYear();
      try {
        return new Date(year, month - 1, day, hour, minute, second);
      } catch {
        return null;
      }
    }
    return null;
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };
// Format date and time for display (used in dropdowns)  const formatDateTime = (date: Date): string => {    return date.toLocaleDateString("en-US", {      month: "short",      day: "numeric",    }) + " " + date.toLocaleTimeString("en-US", {      hour: "numeric",      minute: "2-digit",      hour12: true,    });  };

  // Translate "You" references to player name
  const translateYouReferences = (content: string, name: string): string => {
    if (!name || name.trim() === "") return content;
    const pName = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();

    const replacements: [RegExp | string, string][] = [
      [/.*You fail to cast.*\n/g, ""],
      [/.*You fail to perform.*\n/g, ""],
      [/ [Yy]our /g, ` ${pName} 's `],
      [/ You gain/g, ` ${pName} gains`],
      [/ You hit/g, ` ${pName} hits`],
      [/ You crit/g, ` ${pName} crits`],
      [/ You are/g, ` ${pName} is`],
      [/ You suffer/g, ` ${pName} suffers`],
      [/ You lose/g, ` ${pName} loses`],
      [/ You die/g, ` ${pName} dies`],
      [/ You cast/g, ` ${pName} casts`],
      [/ You create/g, ` ${pName} creates`],
      [/ You perform/g, ` ${pName} performs`],
      [/ You interrupt/g, ` ${pName} interrupts`],
      [/ You miss/g, ` ${pName} misses`],
      [/ You attack/g, ` ${pName} attacks`],
      [/ You block/g, ` ${pName} blocks`],
      [/ You parry/g, ` ${pName} parries`],
      [/ You dodge/g, ` ${pName} dodges`],
      [/ You resist/g, ` ${pName} resists`],
      [/ You absorb/g, ` ${pName} absorbs`],
      [/ You reflect/g, ` ${pName} reflects`],
      [/ You receive/g, ` ${pName} receives`],
      [/ You deflect/g, ` ${pName} deflects`],
      [/ You use/g, ` ${pName} uses`],
      ["causes you", `causes ${pName}`],
      ["heals you", `heals ${pName}`],
      ["hits you for", `hits ${pName} for`],
      ["crits you for", `crits ${pName} for`],
    ];

    let result = content;
    for (const [pattern, replacement] of replacements) {
      if (typeof pattern === "string") {
        result = result.split(pattern).join(replacement);
      } else {
        result = result.replace(pattern, replacement);
      }
    }
    return result;
  };

  // Detect raid type from boss name
  const detectRaidType = (bossName: string): { key: string; name: string } => {
    for (const [key, raid] of Object.entries(RAIDS)) {
      if (raid.finalBoss.toLowerCase() === bossName.toLowerCase()) {
        return { key, name: raid.name };
      }
    }
    return { key: "UNKNOWN", name: "Unknown Raid" };
  };

  // Scan file
  const scanFile = async (content: string) => {
    setProcessing({ status: "scanning", message: "Reading file...", progress: 5 });

    const lines = content.split("\n");
    setRawLines(lines);
    const totalLines = lines.length;

    setProcessing({ status: "scanning", message: `Scanning ${totalLines.toLocaleString()} lines...`, progress: 10 });

    const deaths: BossDeath[] = [];
    let firstTime: Date | null = null;
    let lastTime: Date | null = null;
    let lastLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (i % 50000 === 0) {
        const pct = 10 + Math.floor((i / totalLines) * 80);
        setProcessing({ status: "scanning", message: `Scanning line ${i.toLocaleString()}...`, progress: pct });
        await new Promise(r => setTimeout(r, 0));
      }

      const line = lines[i];
      const ts = parseLogTimestamp(line);

      if (ts) {
        if (!firstTime) firstTime = ts;
        lastTime = ts;
        lastLine = i;
      }

      for (const boss of ALL_BOSSES) {
        if (line.includes(`${boss} dies.`)) {
          const timestamp = parseLogTimestamp(line);
          if (timestamp) {
            const raid = detectRaidType(boss);
            deaths.push({ boss, time: timestamp, line: i, raidType: raid.key, raidName: raid.name });
          }
        }
      }
    }

    deaths.sort((a, b) => a.time.getTime() - b.time.getTime());
    setBossDeaths(deaths);
    setLogInfo({ firstTime, lastTime, lastLine });

    if (!firstTime || !lastTime) {
      setProcessing({ status: "error", message: "Could not read timestamps from log file", progress: 0 });
    } else {
      const bossMsg = deaths.length > 0 ? `${deaths.length} boss kill(s) found` : "No boss kills found";
      setProcessing({ status: "ready", message: `Log: ${formatTime(firstTime)} - ${formatTime(lastTime)}. ${bossMsg}`, progress: 100 });
    }
  };

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) processFile(files[0]);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) processFile(input.files[0]);
  }, []);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setFileSize(file.size);
    setBossDeaths([]);
    setLogInfo({ firstTime: null, lastTime: null, lastLine: 0 });
    setEndMode("");

    try {
      const content = await file.text();
      await scanFile(content);
    } catch (err) {
      setProcessing({ status: "error", message: err instanceof Error ? err.message : "Failed to read file", progress: 0 });
    }
  };

  // Check if form is complete
  const isFormComplete = (): boolean => {
    const hasPlayer = playerName.trim().length > 0;
    const hasRaid = selectedRaid.length > 0;
    const hasDate = startDate.length > 0;
    const hasStart = startTime.length > 0;
    let hasEnd = endMode.startsWith("boss-") || endMode === "endoflog" || (endMode === "custom" && endTime.length > 0);
    return hasPlayer && hasRaid && hasDate && hasStart && hasEnd;
  };

  // Parse time string "HH:MM" to Date using user-selected date
  const parseTimeInput = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const [year, month, day] = startDate.split("-").map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0);
  };

  // Extract the log
  const extractLog = async () => {
    if (!isFormComplete() || !logInfo.firstTime) {
      setProcessing({ status: "error", message: "Please fill in ALL required fields", progress: 0 });
      return;
    }

    setProcessing({ status: "extracting", message: "Extracting raid data...", progress: 10 });

    // Build start time with 5-min buffer
    const startDateTime = parseTimeInput(startTime);
    const bufferedStartTime = new Date(startDateTime.getTime() - PRE_RAID_BUFFER_MINUTES * 60 * 1000);

    // Determine end
    let endDateTime: Date;
    let endLine: number;
    let bossKilled: string | null = null;

    if (endMode.startsWith("boss-")) {
      const bossIdx = parseInt(endMode.replace("boss-", ""));
      const boss = bossDeaths[bossIdx];
      endDateTime = boss.time;
      endLine = boss.line;
      bossKilled = boss.boss;
    } else if (endMode === "endoflog") {
      endDateTime = logInfo.lastTime!;
      endLine = logInfo.lastLine;
    } else {
      endDateTime = parseTimeInput(endTime);
      endLine = logInfo.lastLine;
      for (let i = rawLines.length - 1; i >= 0; i--) {
        const ts = parseLogTimestamp(rawLines[i]);
        if (ts && ts <= endDateTime) {
          endLine = i;
          break;
        }
      }
    }

    setProcessing({ status: "extracting", message: "Filtering by timestamp...", progress: 30 });

    // Filter EVERY line by timestamp - handles out-of-order log files
    const extractedLines = rawLines.filter(line => {
      const ts = parseLogTimestamp(line);
      if (!ts) return false; // Skip lines without valid timestamps
      return ts >= bufferedStartTime && ts <= endDateTime;
    });
    let content = extractedLines.join("\n");

    setProcessing({ status: "extracting", message: "Translating...", progress: 50 });
    content = translateYouReferences(content, playerName);

    setProcessing({ status: "extracting", message: "Creating download...", progress: 70 });

    const dateStr = endDateTime.toISOString().split("T")[0];
    const bossStr = bossKilled ? bossKilled.replace(/[^a-zA-Z]/g, "") : "NoKill";
    const zipFilename = `TurtLog-${selectedRaid}-${dateStr}-${bossStr}.zip`;

    // Create ZIP using fflate (lightweight, works in browser)
    const { zipSync, strToU8 } = await import("https://esm.sh/fflate@0.8.2");
    const zipData = zipSync({ "WoWCombatLog.txt": strToU8(content) });
    const zipBlob = new Blob([zipData], { type: "application/zip" });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = zipFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setProcessing({ status: "extracting", message: "Saving to server...", progress: 85 });

    try {
      const raidInfo = Object.entries(RAIDS).find(([k]) => k === selectedRaid);
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raidType: selectedRaid,
          raidName: raidInfo ? raidInfo[1].name : selectedRaid,
          bossKilled,
          startTime: bufferedStartTime.toISOString(),
          endTime: endDateTime.toISOString(),
          lineCount: extractedLines.length,
          content,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setProcessing({ status: "error", message: `Server error: ${result.error || response.statusText}`, progress: 0 });
        return;
      }

      setProcessing({ status: "done", message: `Done! ${extractedLines.length.toLocaleString()} lines saved. ${result.lootCount || 0} loot items, ${result.epicCount || 0} epic.`, progress: 100 });
    } catch (err) {
      console.error("Upload failed:", err);
      setProcessing({ status: "error", message: `Upload failed: ${err instanceof Error ? err.message : String(err)}`, progress: 0 });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const reset = () => {
    setFileName(null);
    setFileSize(0);
    setBossDeaths([]);
    setLogInfo({ firstTime: null, lastTime: null, lastLine: 0 });
    setRawLines([]);
    setProcessing({ status: "idle", message: "", progress: 0 });
    setSelectedRaid("");
    setStartDate("");
    setStartTime("");
    setEndMode("");
    setEndTime("");
  };

  // Dark theme styles for inputs
  const inputStyle = {
    padding: "12px 14px",
    background: "#1c1c1e",
    border: "1px solid #3a3a3c",
    borderRadius: "8px",
    color: "#ffffff",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const inputFilledStyle = {
    ...inputStyle,
    border: "1px solid #34c759",
  };

  return (
    <div>
      {/* Dark theme style overrides for native inputs */}
      <style>{`
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1);
          cursor: pointer;
          opacity: 1;
        }
        input[type="time"],
        input[type="date"] {
          color-scheme: dark;
        }
        select {
          color-scheme: dark;
        }
        select option {
          background: #1c1c1e;
          color: #ffffff;
        }
      `}</style>

      {/* File Drop Zone */}
      {processing.status === "idle" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? "#5794f2" : "#3a3a3c"}`,
            borderRadius: "12px",
            padding: "48px 24px",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "rgba(87, 148, 242, 0.1)" : "#1c1c1e",
            transition: "all 0.2s ease",
          }}
        >
          <input ref={fileInputRef} type="file" accept=".txt" onChange={handleFileSelect} style={{ display: "none" }} />
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📁</div>
          <p style={{ color: "#ffffff", fontWeight: "500", marginBottom: "8px" }}>Drop your combat log here</p>
          <p style={{ color: "#8e8e93", fontSize: "14px" }}>or click to browse</p>
        </div>
      )}

      {/* Scanning */}
      {processing.status === "scanning" && (
        <div style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🔍</div>
          <p style={{ color: "#ffffff", fontWeight: "500", marginBottom: "16px" }}>{processing.message}</p>
          <div style={{ width: "100%", height: "8px", background: "#2c2c2e", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${processing.progress}%`, height: "100%", background: "#5794f2", transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* Extracting */}
      {processing.status === "extracting" && (
        <div style={{ padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>📦</div>
          <p style={{ color: "#ffffff", fontWeight: "500", marginBottom: "16px" }}>{processing.message}</p>
          <div style={{ width: "100%", height: "8px", background: "#2c2c2e", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: `${processing.progress}%`, height: "100%", background: "#34c759", transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {/* Error */}
      {processing.status === "error" && (
        <div style={{ background: "rgba(255, 69, 58, 0.15)", border: "1px solid #ff453a", borderRadius: "8px", padding: "16px", textAlign: "center" }}>
          <p style={{ color: "#ff453a", marginBottom: "12px" }}>{processing.message}</p>
          <button onClick={reset} style={{ padding: "10px 20px", background: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", color: "#ffffff", cursor: "pointer" }}>
            Try Again
          </button>
        </div>
      )}

      {/* Done */}
      {processing.status === "done" && (
        <div style={{ background: "rgba(52, 199, 89, 0.15)", border: "1px solid #34c759", borderRadius: "8px", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
          <p style={{ color: "#34c759", fontWeight: "500", marginBottom: "16px" }}>{processing.message}</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button onClick={reset} style={{ padding: "12px 24px", background: "#2c2c2e", border: "1px solid #3a3a3c", borderRadius: "8px", color: "#ffffff", cursor: "pointer" }}>
              Process Another
            </button>
            <a href="/analysis" style={{ padding: "12px 24px", background: "#5794f2", border: "none", borderRadius: "8px", color: "white", textDecoration: "none" }}>
              View Analysis
            </a>
          </div>
        </div>
      )}

      {/* Ready - Form */}
      {processing.status === "ready" && logInfo.firstTime && (
        <div>
          {/* File Info */}
          <div style={{ background: "#1c1c1e", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: "500", color: "#ffffff" }}>{fileName}</div>
              <div style={{ fontSize: "13px", color: "#8e8e93" }}>
                {formatFileSize(fileSize)} • {formatTime(logInfo.firstTime)} - {formatTime(logInfo.lastTime!)}
              </div>
            </div>
            <button onClick={reset} style={{ padding: "8px 14px", background: "transparent", border: "1px solid #3a3a3c", borderRadius: "6px", color: "#8e8e93", cursor: "pointer", fontSize: "13px" }}>
              Change
            </button>
          </div>

          {/* 1. Character Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#ffffff", fontSize: "14px" }}>
              Your Character Name
            </label>
            <input
              type="text"
              value={playerName}
              onInput={(e) => setPlayerName((e.target as HTMLInputElement).value)}
              placeholder="Enter your character name"
              style={playerName.trim() ? inputFilledStyle : inputStyle}
            />
          </div>

          {/* 2. Select Raid */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#ffffff", fontSize: "14px" }}>
              Raid
            </label>
            <select
              value={selectedRaid}
              onChange={(e) => setSelectedRaid((e.target as HTMLSelectElement).value)}
              style={selectedRaid ? inputFilledStyle : inputStyle}
            >
              <option value="">Select raid...</option>
              {Object.entries(RAIDS).map(([key, raid]) => (
                <option key={key} value={key}>{raid.name}</option>
              ))}
            </select>
          </div>

          {/* 3. Start Date - Native date picker */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#ffffff", fontSize: "14px" }}>
              Raid Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
              style={startDate ? inputFilledStyle : inputStyle}
            />
          </div>

          {/* 4. Start Time - Native time picker */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#ffffff", fontSize: "14px" }}>
              Raid Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime((e.target as HTMLInputElement).value)}
              style={startTime ? inputFilledStyle : inputStyle}
            />
            <p style={{ fontSize: "12px", color: "#8e8e93", marginTop: "6px" }}>
              Log extraction starts {PRE_RAID_BUFFER_MINUTES} min before this to capture pre-raid buffs
            </p>
          </div>

          {/* 5. End Point */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#ffffff", fontSize: "14px" }}>
              Log End Point
            </label>
            <select
              value={endMode}
              onChange={(e) => setEndMode((e.target as HTMLSelectElement).value)}
              style={endMode ? inputFilledStyle : inputStyle}
            >
              <option value="">Select end point...</option>
              {bossDeaths.length > 0 && (
                <optgroup label="Boss Kills">
                  {bossDeaths.map((death, idx) => (
                    <option key={idx} value={`boss-${idx}`}>
                      {death.boss} @ {formatTime(death.time)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Other">
                <option value="endoflog">End of log ({logInfo.lastTime ? formatTime(logInfo.lastTime) : ""})</option>
                <option value="custom">Custom time...</option>
              </optgroup>
            </select>

            {/* Custom end time */}
            {endMode === "custom" && (
              <div style={{ marginTop: "12px" }}>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime((e.target as HTMLInputElement).value)}
                  style={endTime ? inputFilledStyle : inputStyle}
                />
              </div>
            )}
          </div>

          {/* Extract Button */}
          <button
            onClick={extractLog}
            disabled={!isFormComplete()}
            style={{
              width: "100%",
              padding: "16px",
              background: isFormComplete() ? "#5794f2" : "#3a3a3c",
              border: isFormComplete() ? "none" : "1px solid #636366",
              borderRadius: "10px",
              color: isFormComplete() ? "#ffffff" : "#a1a1a6",
              fontWeight: "600",
              fontSize: "16px",
              cursor: isFormComplete() ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
          >
            {isFormComplete() ? "Extract & Upload" : "Fill all fields to continue"}
          </button>
        </div>
      )}
    </div>
  );
}
