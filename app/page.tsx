"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function Home() {
  const [examFiles, setExamFiles] = useState<any[]>([]);
  const [certFiles, setCertFiles] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [roomFilter, setRoomFilter] = useState("ALL");

  // =========================
  // CLEAN TEXT
  // =========================
  const cleanText = (text: any) => {
    if (!text) return "";

    return String(text)
      .normalize("NFC")
      .replace(/[^a-zA-Z0-9À-ỹ\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
  };

  // =========================
  // CLEAN ROOM
  // =========================
  const cleanRoom = (text: any) => {
    if (!text) return "";

    const room = String(text).match(/R\d+/i);

    return room ? room[0].toUpperCase() : "";
  };

  // =========================
  // CLEAN CCCD
  // =========================
  const cleanID = (id: any) => {
    if (!id) return "";

    return String(id).replace(/\D/g, "");
  };

  // =========================
  // READ EXCEL
  // =========================
  const readExcel = async (file: File) => {
    return new Promise<any[]>((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target?.result;

        const workbook = XLSX.read(data, {
          type: "binary",
          cellText: true,
          cellDates: false,
        });

        const sheetName = workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        resolve(json as any[]);
      };

      reader.readAsBinaryString(file);
    });
  };

  // =========================
  // PROCESS FILES
  // =========================
  const processFiles = async () => {
    let examData: any[] = [];
    let certData: any[] = [];

    // READ EXAM FILES
    for (const file of examFiles) {
      const data = await readExcel(file);
      examData = [...examData, ...data];
    }

    // READ CERT FILES
    for (const file of certFiles) {
      const data = await readExcel(file);
      certData = [...certData, ...data];
    }

    // =========================
    // MAP CERT
    // =========================
    const certMap = new Map();

    certData.forEach((row) => {
      const id = cleanID(row[5]);

      if (!id) return;

      certMap.set(id, {
        enrolment: row[3] || "",
        last3: String(row[3] || "").slice(-3),
      });
    });

    // =========================
    // RESULT
    // =========================
    const finalResult: any[] = [];

    examData.forEach((row) => {
      const stt = row[0];

      // BỎ HEADER
      if (
        String(stt).toLowerCase().includes("no") ||
        String(stt).toLowerCase().includes("candidate")
      ) {
        return;
      }

      const lastName = cleanText(row[1]);
      const firstName = cleanText(row[2]);

      const fullName = `${lastName} ${firstName}`
        .replace(/\s+/g, " ")
        .trim();

      const id = cleanID(row[5]);

      const room = cleanRoom(row[8]);

      const cert = certMap.get(id);

      finalResult.push({
        stt: stt || "",
        room: room || "",
        id,
        name: fullName,
        enrolment: cert?.enrolment || "NO DATA",
        last3: cert?.last3 || "NO DATA",
        status: cert ? "MATCH" : "ABSENT / REJECTED",
      });
    });

    setResults(finalResult);
  };

  // =========================
  // EXPORT EXCEL
  // =========================
  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(results);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "RESULT"
    );

    XLSX.writeFile(
      workbook,
      "KET_QUA_DOI_SOAT.xlsx"
    );
  };

  // =========================
  // FILTER
  // =========================
  const filteredResults = results.filter((item) => {
    const keyword =
      item.name.includes(search.toUpperCase()) ||
      item.id.includes(search);

    const roomMatch =
      roomFilter === "ALL" || item.room === roomFilter;

    return keyword && roomMatch;
  });

  // ROOM LIST
  const roomList = [
    ...new Set(
      results
        .map((item) => item.room)
        .filter(Boolean)
    ),
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        padding: 30,
        fontFamily:
          "'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* CONTAINER */}
      <div
        style={{
          maxWidth: 1450,
          margin: "0 auto",
        }}
      >
        {/* LOGO */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 25,
  }}
>
  <img
    src="/logo.png"
    alt="logo"
    style={{
      width: 420,
      maxWidth: "100%",
      objectFit: "contain",
      filter:
        "drop-shadow(0 8px 20px rgba(0,0,0,0.08))",
    }}
  />
</div>

        {/* TITLE */}
        <h1
          style={{
            textAlign: "center",
            fontSize: 42,
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: 8,
          }}
        >
          VTED CERTIFICATE MATCHER
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#64748b",
            marginBottom: 35,
            fontSize: 16,
          }}
        >
          Đối chiếu danh sách thi và danh sách chứng chỉ
        </p>

        {/* UPLOAD */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 30,
            flexWrap: "wrap",
          }}
        >
          {/* DANH SÁCH THI */}
          <div
            style={{
              flex: 1,
              minWidth: 320,
              background: "#fff",
              padding: 22,
              borderRadius: 24,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                marginBottom: 15,
                fontSize: 20,
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              📘 Danh Sách Thi
            </h3>

            <label
              style={{
                display: "inline-block",
                background: "#2563eb",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Upload File

              <input
                type="file"
                multiple
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => {
                  if (!e.target.files) return;

                  const files = Array.from(
                    e.target.files
                  );

                  setExamFiles((prev) => [
                    ...prev,
                    ...files,
                  ]);
                }}
              />
            </label>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {examFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    background: "#f8fafc",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border:
                      "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "#334155",
                    }}
                  >
                    {file.name}
                  </span>

                  <button
                    onClick={() => {
                      const updated = [
                        ...examFiles,
                      ];

                      updated.splice(index, 1);

                      setExamFiles(updated);
                    }}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DANH SÁCH CHỨNG CHỈ */}
          <div
            style={{
              flex: 1,
              minWidth: 320,
              background: "#fff",
              padding: 22,
              borderRadius: 24,
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <h3
              style={{
                marginBottom: 15,
                fontSize: 20,
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              📗 Danh Sách Chứng Chỉ
            </h3>

            <label
              style={{
                display: "inline-block",
                background: "#16a34a",
                color: "#fff",
                padding: "10px 18px",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Upload File

              <input
                type="file"
                multiple
                accept=".xlsx,.xls"
                hidden
                onChange={(e) => {
                  if (!e.target.files) return;

                  const files = Array.from(
                    e.target.files
                  );

                  setCertFiles((prev) => [
                    ...prev,
                    ...files,
                  ]);
                }}
              />
            </label>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {certFiles.map((file, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    background: "#f8fafc",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border:
                      "1px solid #e2e8f0",
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      color: "#334155",
                    }}
                  >
                    {file.name}
                  </span>

                  <button
                    onClick={() => {
                      const updated = [
                        ...certFiles,
                      ];

                      updated.splice(index, 1);

                      setCertFiles(updated);
                    }}
                    style={{
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 10px",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACTION */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 30,
          }}
        >
          <button
            onClick={processFiles}
            style={{
              flex: 1,
              background:
                "linear-gradient(135deg,#2563eb,#1d4ed8)",
              color: "#fff",
              border: "none",
              borderRadius: 18,
              padding: 18,
              fontSize: 20,
              fontWeight: 800,
              fontFamily: "'Segoe UI', Arial, sans-serif",
              letterSpacing: 1,
              cursor: "pointer",
              boxShadow:
                "0 10px 25px rgba(37,99,235,0.3)",
            }}
          >
            ĐỐI SOÁT DỮ LIỆU
          </button>

          <button
            onClick={exportExcel}
            style={{
              background:
              "linear-gradient(135deg,#0f172a,#1e293b)",
              color: "#fff",
              border: "none",
              borderRadius: 18,
              padding: "0 28px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow:
              "0 10px 25px rgba(15,23,42,0.25)",
            }}
          >
            EXPORT EXCEL
          </button>
        </div>

        {/* FILTER */}
        <div
          style={{
            display: "flex",
            gap: 15,
            marginBottom: 30,
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="🔍 Tìm CCCD hoặc tên..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            style={{
              flex: 1,
              minWidth: 250,
              padding: 16,
              borderRadius: 16,
              border: "1px solid #dbe2ea",
              fontSize: 15,
              background: "#fff",
            }}
          />

          <select
            value={roomFilter}
            onChange={(e) =>
              setRoomFilter(e.target.value)
            }
            style={{
              width: 220,
              padding: 16,
              borderRadius: 16,
              border: "1px solid #dbe2ea",
              fontSize: 15,
              background: "#fff",
            }}
          >
            <option value="ALL">
              Tất cả phòng
            </option>

            {roomList.map((room, index) => (
              <option key={index} value={room}>
                {room}
              </option>
            ))}
          </select>
        </div>

        {/* RESULT */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              marginBottom: 16,
              alignItems: "center",
            }}
          >
            <h2
  style={{
    fontSize: 30,
    fontWeight: 800,
    color: "#0f172a",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  }}
>
  KẾT QUẢ
</h2>

            <span
              style={{
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              Tổng: {filteredResults.length} dòng
            </span>
          </div>

          <div
            style={{
              overflowX: "auto",
              borderRadius: 24,
              background: "#fff",
              border: "1px solid #e2e8f0",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.05)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead
                style={{
                  background:
                    "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  color: "#fff",
                }}
              >
                <tr>
                  <th style={thStyle}>STT</th>
                  <th style={thStyle}>
                    Phòng Thi
                  </th>
                  <th style={thStyle}>
                    CCCD / Passport
                  </th>
                  <th style={thStyle}>
                    Họ & Tên
                  </th>
                  <th style={thStyle}>
                    Enrolment ID
                  </th>
                  <th style={thStyle}>
                    3 Số Cuối Mã Tham Chiếu
                  </th>
                  <th style={thStyle}>
                    Trạng Thái
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredResults.map(
                  (item, index) => (
                    <tr
                      key={index}
                      style={{
                        borderBottom:
                          "1px solid #f1f5f9",
                      }}
                    >
                      <td style={tdStyle}>
                        {item.stt}
                      </td>

                      <td style={tdStyle}>
                        {item.room}
                      </td>

                      <td style={tdStyle}>
                        {item.id}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {item.name}
                      </td>

                      <td style={tdStyle}>
                        {item.enrolment}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          color: "#16a34a",
                          fontWeight: 800,
                          fontSize: 28,
                        }}
                      >
                        {item.last3}
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            background:
                              item.status ===
                              "MATCH"
                                ? "#dcfce7"
                                : "#fee2e2",

                            color:
                              item.status ===
                              "MATCH"
                                ? "#16a34a"
                                : "#dc2626",

                            padding:
                              "8px 14px",

                            borderRadius:
                              999,

                            fontWeight: 700,

                            fontSize: 12,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: 18,
  textAlign: "left" as const,
  fontSize: 14,
  fontWeight: 700,
};

const tdStyle = {
  padding: 18,
  fontSize: 14,
};