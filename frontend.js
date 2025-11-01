import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Plus, Trash2, BarChart3, AlertCircle } from 'lucide-react';

const PortfolioOptimizer = () => {
  const [holdings, setHoldings] = useState([]);
  const [newStock, setNewStock] = useState({ ticker: '', quantity: '' });
  const [benchmark, setBenchmark] = useState('^NSEI');
  const [startDate, setStartDate] = useState('2018-01-01');
  const [riskFreeRate, setRiskFreeRate] = useState(0.065);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const saved = await window.storage.get('portfolio-data');
      if (saved) {
        const data = JSON.parse(saved.value);
        setHoldings(data.holdings || []);
        setBenchmark(data.benchmark || '^NSEI');
        setStartDate(data.startDate || '2018-01-01');
        setRiskFreeRate(data.riskFreeRate || 0.065);
      }
    } catch (err) {
      console.log('No saved data found');
    }
  };

  const saveData = async (newHoldings) => {
    try {
      await window.storage.set('portfolio-data', JSON.stringify({
        holdings: newHoldings,
        benchmark,
        startDate,
        riskFreeRate
      }));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  const addHolding = () => {
    if (newStock.ticker && newStock.quantity) {
      const updated = [...holdings, { 
        ticker: newStock.ticker.toUpperCase(), 
        quantity: parseFloat(newStock.quantity),
        id: Date.now()
      }];
      setHoldings(updated);
      saveData(updated);
      setNewStock({ ticker: '', quantity: '' });
      setError('');
    }
  };

  const removeHolding = (id) => {
    const updated = holdings.filter(h => h.id !== id);
    setHoldings(updated);
    saveData(updated);
  };

  const analyzePortfolio = async () => {
    if (holdings.length === 0) {
      setError('Please add at least one stock holding');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          holdings: holdings.reduce((acc, h) => {
            acc[h.ticker] = h.quantity;
            return acc;
          }, {}),
          benchmark,
          start_date: startDate,
          risk_free_rate: riskFreeRate
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setResults(null);
      } else {
        setResults(data);
        await window.storage.set('portfolio-results', JSON.stringify(data));
      }
    } catch (err) {
      setError('Failed to connect to backend. Make sure the Flask server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const formatPercent = (val) => (val * 100).toFixed(2) + '%';
  const formatNumber = (val) => val.toFixed(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#283618] via-[#606C38] to-[#283618] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#FEFAE0]/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border-2 border-[#606C38]">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-10 h-10 text-[#606C38]" />
            <h1 className="text-4xl font-bold text-[#283618]">Portfolio Optimizer</h1>
          </div>

          {/* Input Section */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#606C38]/10 rounded-xl p-6 border-2 border-[#606C38]/30">
              <h2 className="text-xl font-semibold text-[#283618] mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Holdings
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#283618] mb-2">Stock Ticker</label>
                  <input
                    type="text"
                    placeholder="e.g., HFCL.NS"
                    value={newStock.ticker}
                    onChange={(e) => setNewStock({...newStock, ticker: e.target.value})}
                    className="w-full px-4 py-2 bg-white border-2 border-[#606C38]/30 rounded-lg text-[#283618] placeholder-[#606C38]/50 focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#283618] mb-2">Quantity</label>
                  <input
                    type="number"
                    placeholder="Number of shares"
                    value={newStock.quantity}
                    onChange={(e) => setNewStock({...newStock, quantity: e.target.value})}
                    className="w-full px-4 py-2 bg-white border-2 border-[#606C38]/30 rounded-lg text-[#283618] placeholder-[#606C38]/50 focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={addHolding}
                  className="w-full bg-[#606C38] hover:bg-[#283618] text-[#FEFAE0] font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Stock
                </button>
              </div>

              {holdings.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-medium text-[#283618]">Current Holdings:</h3>
                  {holdings.map((h) => (
                    <div key={h.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-[#606C38]/20">
                      <span className="text-[#283618] font-mono font-semibold">{h.ticker}: {h.quantity}</span>
                      <button
                        onClick={() => removeHolding(h.id)}
                        className="text-[#BC6C25] hover:text-[#BC6C25]/70 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#606C38]/10 rounded-xl p-6 border-2 border-[#606C38]/30">
              <h2 className="text-xl font-semibold text-[#283618] mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analysis Parameters
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#283618] mb-2">Benchmark Index</label>
                  <input
                    type="text"
                    value={benchmark}
                    onChange={(e) => setBenchmark(e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-[#606C38]/30 rounded-lg text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent"
                  />
                  <p className="text-xs text-[#606C38] mt-1">Default: ^NSEI (NIFTY 50)</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#283618] mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-white border-2 border-[#606C38]/30 rounded-lg text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#283618] mb-2">Risk-Free Rate</label>
                  <input
                    type="number"
                    step="0.001"
                    value={riskFreeRate}
                    onChange={(e) => setRiskFreeRate(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 bg-white border-2 border-[#606C38]/30 rounded-lg text-[#283618] focus:outline-none focus:ring-2 focus:ring-[#606C38] focus:border-transparent"
                  />
                  <p className="text-xs text-[#606C38] mt-1">Annual rate (e.g., 0.065 = 6.5%)</p>
                </div>

                <button
                  onClick={analyzePortfolio}
                  disabled={loading || holdings.length === 0}
                  className="w-full bg-gradient-to-r from-[#606C38] to-[#283618] hover:from-[#283618] hover:to-[#606C38] disabled:from-gray-400 disabled:to-gray-500 text-[#FEFAE0] font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? 'Analyzing...' : 'Analyze Portfolio'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-[#BC6C25]/20 border-2 border-[#BC6C25] rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#BC6C25] flex-shrink-0 mt-0.5" />
              <p className="text-[#BC6C25] font-medium">{error}</p>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Portfolio Metrics */}
                <div className="bg-gradient-to-br from-[#606C38] to-[#283618] rounded-xl p-6 border-2 border-[#606C38] shadow-xl">
                  <h3 className="text-2xl font-bold text-[#FEFAE0] mb-4">Your Portfolio</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#FEFAE0]/90">CAGR:</span>
                      <span className="text-2xl font-bold text-[#DDA15E]">{formatPercent(results.portfolio.cagr)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#FEFAE0]/90">Annual Volatility:</span>
                      <span className="text-xl font-semibold text-[#DDA15E]">{formatPercent(results.portfolio.annual_vol)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#FEFAE0]/90">Sharpe Ratio:</span>
                      <span className="text-xl font-semibold text-[#DDA15E]">{formatNumber(results.portfolio.sharpe)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#FEFAE0]/90">Max Drawdown:</span>
                      <span className="text-xl font-semibold text-[#BC6C25]">{formatPercent(results.portfolio.max_drawdown)}</span>
                    </div>
                  </div>
                </div>

                {/* Benchmark Metrics */}
                <div className="bg-gradient-to-br from-[#DDA15E] to-[#BC6C25] rounded-xl p-6 border-2 border-[#DDA15E] shadow-xl">
                  <h3 className="text-2xl font-bold text-[#283618] mb-4">Benchmark ({benchmark})</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[#283618]/90">CAGR:</span>
                      <span className="text-2xl font-bold text-[#283618]">{formatPercent(results.benchmark.cagr)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#283618]/90">Annual Volatility:</span>
                      <span className="text-xl font-semibold text-[#283618]">{formatPercent(results.benchmark.annual_vol)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#283618]/90">Sharpe Ratio:</span>
                      <span className="text-xl font-semibold text-[#283618]">{formatNumber(results.benchmark.sharpe)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#283618]/90">Max Drawdown:</span>
                      <span className="text-xl font-semibold text-[#606C38]">{formatPercent(results.benchmark.max_drawdown)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white rounded-xl p-6 border-2 border-[#606C38]/30 shadow-lg">
                <h3 className="text-xl font-bold text-[#283618] mb-4">Cumulative Returns (Normalized)</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={results.chart_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#606C38" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#283618"
                      tick={{ fill: '#283618' }}
                    />
                    <YAxis 
                      stroke="#283618"
                      tick={{ fill: '#283618' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FEFAE0', 
                        border: '2px solid #606C38',
                        borderRadius: '8px',
                        color: '#283618'
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#283618' }} />
                    <Line 
                      type="monotone" 
                      dataKey="portfolio" 
                      stroke="#606C38" 
                      strokeWidth={3}
                      name="Your Portfolio"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="benchmark" 
                      stroke="#DDA15E" 
                      strokeWidth={3}
                      name={benchmark}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioOptimizer;
