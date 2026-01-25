import { useEffect, useState, useMemo } from "react";
import UserLayout from "../../layouts/UserLayout";
import { supabase } from "../../supabase";
import { Spinner } from "../../components/Spinner";
import { colors, borderRadius } from "../../styles/theme";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function Home() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [totalFund, setTotalFund] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHomeData = async () => {
      const startTime = Date.now();
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);

        // Fetch recent transactions for display
        const { data: txnData, error: txnError } = await supabase
          .from("transactions")
          .select("id, txn_id, title, amount, type, created_at")
          .order("created_at", { ascending: false })
          .limit(20);

        if (txnError) throw txnError;

        // Fetch all transactions for balance calculation and charts
        const { data: allTxns, error: allTxnError } = await supabase
          .from("transactions")
          .select("id, amount, type, created_at")
          .order("created_at", { ascending: true });

        if (allTxnError) throw allTxnError;

        // Calculate total fund
        let balance = 0;
        (allTxns || []).forEach(txn => {
          if (txn.type === "credit") balance += Number(txn.amount);
          if (txn.type === "debit") balance -= Number(txn.amount);
        });

        if (isMounted) {
          setTransactions(txnData || []);
          setAllTransactions(allTxns || []);
          setTotalFund(balance);
        }
      } catch (err) {
        if (err.name === 'AbortError' || err.message?.includes('AbortError')) {
          // Don't log or show error for AbortError
        } else if (isMounted) {
          setError("Failed to load home data");
        }
      } finally {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 2000 - elapsed);
        setTimeout(() => {
          if (isMounted) {
            setLoading(false);
          }
        }, remaining);
      }
    };

    fetchHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Generate balance chart data (running balance over time)
  const balanceChartData = useMemo(() => {
    if (!allTransactions.length) return [];
    
    let runningBalance = 0;
    const dataPoints = [];
    
    // Group transactions by date
    const txnsByDate = {};
    allTransactions.forEach(txn => {
      const date = new Date(txn.created_at).toISOString().split('T')[0];
      if (!txnsByDate[date]) txnsByDate[date] = [];
      txnsByDate[date].push(txn);
    });

    // Calculate running balance for each date
    Object.keys(txnsByDate).sort().forEach(date => {
      txnsByDate[date].forEach(txn => {
        if (txn.type === "credit") runningBalance += Number(txn.amount);
        if (txn.type === "debit") runningBalance -= Number(txn.amount);
      });
      dataPoints.push({
        date,
        balance: runningBalance,
        displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    });

    // If we have too many points, sample them
    if (dataPoints.length > 30) {
      const step = Math.floor(dataPoints.length / 30);
      return dataPoints.filter((_, idx) => idx % step === 0 || idx === dataPoints.length - 1);
    }

    return dataPoints;
  }, [allTransactions]);

  // Generate heatmap data for current calendar year (Jan 1 - Dec 31)
  const heatmapData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Create a map of date -> { credits, debits, count }
    const txnMap = {};
    allTransactions.forEach(txn => {
      const txnDate = new Date(txn.created_at);
      // Format as YYYY-MM-DD in local timezone
      const year = txnDate.getFullYear();
      const month = String(txnDate.getMonth() + 1).padStart(2, '0');
      const day = String(txnDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!txnMap[dateKey]) txnMap[dateKey] = { credits: 0, debits: 0, count: 0 };
      if (txn.type === "credit") txnMap[dateKey].credits += Number(txn.amount);
      if (txn.type === "debit") txnMap[dateKey].debits += Number(txn.amount);
      txnMap[dateKey].count++;
    });

    // Start from Jan 1 of current year
    const startDate = new Date(currentYear, 0, 1); // Jan 1
    const endDate = new Date(currentYear, 11, 31); // Dec 31
    
    // Adjust start to the Sunday of that week
    const startDay = startDate.getDay(); // 0 = Sunday
    const adjustedStart = new Date(startDate);
    adjustedStart.setDate(adjustedStart.getDate() - startDay);
    
    const weeks = [];
    let currentDate = new Date(adjustedStart);
    
    // Generate all weeks until end of year
    while (currentDate <= endDate || weeks.length < 53) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        
        // Only include dates within current year and up to today
        const isInCurrentYear = currentDate.getFullYear() === currentYear;
        const isUpToToday = currentDate <= today;
        const isFuture = currentDate > today && isInCurrentYear;
        
        const data = txnMap[dateKey] || { credits: 0, debits: 0, count: 0 };
        week.push({
          date: dateKey,
          displayDate: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          credits: data.credits,
          debits: data.debits,
          count: data.count,
          hasActivity: data.count > 0,
          isCurrentYear: isInCurrentYear,
          isFuture: isFuture && isInCurrentYear
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeks.push(week);
      
      // Stop after we've passed the end of the year
      if (currentDate.getFullYear() > currentYear) break;
    }

    return { weeks, year: currentYear };
  }, [allTransactions]);

  // Count total transactions in current year
  const yearlyTxnCount = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return allTransactions.filter(txn => new Date(txn.created_at).getFullYear() === currentYear).length;
  }, [allTransactions]);

  // Get color for heatmap cell
  const getHeatmapColor = (cell) => {
    // Future dates or dates outside current year - very dim
    if (cell.isFuture || !cell.isCurrentYear) return `${colors.bgSecondary}50`;
    // No activity - normal dim
    if (!cell.hasActivity) return colors.bgSecondary;
    if (cell.credits > cell.debits) {
      // More income - green shades
      const intensity = Math.min(cell.credits / 10000, 1);
      return `rgba(51, 209, 122, ${0.3 + intensity * 0.7})`;
    } else {
      // More spending - red shades
      const intensity = Math.min(cell.debits / 10000, 1);
      return `rgba(236, 94, 94, ${0.3 + intensity * 0.7})`;
    }
  };

  const formatTimeAgo = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <UserLayout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ textAlign: "left", fontSize: 34, fontWeight: 800, margin: "32px 0 8px 0", letterSpacing: -1, color: colors.textPrimary }}>Home</h1>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Spinner />
        </div>
      )}
      {error && <p style={{ color: colors.accentRed }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Main Grid: Balance Card + Recent Transactions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
            {/* Balance Card with Chart */}
            <div style={balanceCardStyle}>
              <div style={{ marginBottom: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Account balance</h3>
              </div>
              <h2 style={{ 
                fontSize: 48, 
                fontWeight: 700, 
                color: colors.textPrimary,
                margin: 0,
                marginBottom: 24,
                lineHeight: 1.2,
              }}>
                ₹{totalFund.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </h2>
              
              {/* Balance Chart */}
              <div style={{ height: 200, marginTop: 16 }}>
                {balanceChartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceChartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                      <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.accentGreen} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={colors.accentGreen} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.textMuted, fontSize: 11 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        hide={true}
                        domain={['dataMin - 1000', 'dataMax + 1000']}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: colors.bgCard, 
                          border: `1px solid ${colors.border}`,
                          borderRadius: 8,
                          color: colors.textPrimary
                        }}
                        formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, 'Balance']}
                        labelFormatter={(label) => label}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        stroke={colors.accentGreen} 
                        strokeWidth={2}
                        fill="url(#balanceGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ 
                    height: "100%", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: colors.textMuted 
                  }}>
                    Not enough data for chart
                  </div>
                )}
              </div>
            </div>

            {/* Recent Transactions */}
            <div style={cardStyle}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                marginBottom: 16
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Recent transactions</h3>
                <a href="/transactions" style={{ 
                  color: colors.textMuted, 
                  fontSize: 13, 
                  textDecoration: "none",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}>
                  See all <span style={{ fontSize: 16 }}>›</span>
                </a>
              </div>

              <div>
                {transactions.slice(0, 4).map(txn => (
                  <div
                    key={txn.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "8px 0",
                      borderBottom: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: 0, 
                        fontSize: 13, 
                        fontWeight: 500,
                        marginBottom: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 180
                      }}>
                        {txn.title || txn.txn_id}
                      </p>
                      <span style={{ fontSize: 11, color: colors.textMuted }}>
                        {formatTimeAgo(txn.created_at)}
                      </span>
                    </div>
                    <span style={{
                      fontWeight: 600,
                      fontSize: 13,
                      color: txn.type === "credit" ? colors.accentGreen : colors.accentRed
                    }}>
                      {txn.type === "credit" ? "" : "-"}₹{Number(txn.amount).toLocaleString()}
                    </span>
                  </div>
                ))}

                {transactions.length === 0 && (
                  <p style={{ color: colors.textMuted, textAlign: "center", padding: 20 }}>
                    No transactions yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Heatmap */}
          <div style={cardStyle}>
            <div style={{ marginBottom: 20 }}>
              <span style={{ 
                fontSize: 12, 
                fontWeight: 600, 
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                {yearlyTxnCount} TRANSACTIONS IN {heatmapData.year}
              </span>
            </div>
            
            <div style={{ 
              display: "flex", 
              justifyContent: "center",
              alignItems: "flex-start",
              gap: 4,
              paddingBottom: 8
            }}>
              {heatmapData.weeks.map((week, weekIdx) => (
                <div key={weekIdx} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {week.map((day, dayIdx) => (
                    <div
                      key={dayIdx}
                      title={day.isFuture ? day.displayDate : (day.hasActivity ? `${day.displayDate}: ${day.count} txn(s) - ₹${day.credits.toLocaleString()} in, ₹${day.debits.toLocaleString()} out` : day.displayDate)}
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        background: getHeatmapColor(day),
                        cursor: day.hasActivity ? "pointer" : "default"
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 24, 
              marginTop: 16,
              paddingTop: 16,
              borderTop: `1px solid ${colors.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: 2, 
                  background: colors.accentGreen 
                }} />
                <span style={{ fontSize: 13, color: colors.textSecondary }}>More income</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ 
                  width: 12, 
                  height: 12, 
                  borderRadius: 2, 
                  background: colors.accentRed 
                }} />
                <span style={{ fontSize: 13, color: colors.textSecondary }}>More spending</span>
              </div>
            </div>
          </div>
        </>
      )}
    </UserLayout>
  );
}

/* ---------- styles ---------- */

const cardStyle = {
  background: colors.bgCard,
  padding: "20px",
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border}`,
};

const balanceCardStyle = {
  background: colors.bgCard,
  padding: "24px",
  borderRadius: borderRadius.lg,
  border: `1px solid ${colors.border}`,
};

export default Home;
