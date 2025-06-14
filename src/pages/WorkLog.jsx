import { useState, useEffect } from 'react';
import './WorkLog.css';

function WorkLog({ apiBaseUrl, userId }) {
  // 状態管理
  const [selectedBonsaiId, setSelectedBonsaiId] = useState(null);
  const [bonsaiList, setBonsaiList] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [workTypes, setWorkTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // 今日の日付
    work_type: '',
    description: '',
    notes: '',
    duration: ''
  });

  // 盆栽一覧を取得
  const fetchBonsaiList = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setBonsaiList(data);
        
        // グローバルに保存された選択済み盆栽IDがあれば使用
        if (window.selectedBonsaiId && data.some(b => b.id === window.selectedBonsaiId)) {
          setSelectedBonsaiId(window.selectedBonsaiId);
        } else if (data.length > 0) {
          setSelectedBonsaiId(data[0].id);
          window.selectedBonsaiId = data[0].id;
        }
      } else {
        setError('盆栽一覧の取得に失敗しました');
      }
    } catch (error) {
      console.error('盆栽一覧取得エラー:', error);
      setError('盆栽一覧の取得に失敗しました');
    }
  };

  // 作業種別一覧を取得
  const fetchWorkTypes = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/work-logs/work-types`);
      if (response.ok) {
        const data = await response.json();
        setWorkTypes(data);
      } else {
        console.error('作業種別の取得に失敗しました');
      }
    } catch (error) {
      console.error('作業種別取得エラー:', error);
    }
  };

  // 作業記録を取得
  const fetchWorkLogs = async () => {
    if (!selectedBonsaiId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/work-logs/${selectedBonsaiId}?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setWorkLogs(data);
      } else {
        setError('作業記録の取得に失敗しました');
      }
    } catch (error) {
      console.error('作業記録取得エラー:', error);
      setError('作業記録の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    if (userId) {
      fetchBonsaiList();
      fetchWorkTypes();
    }
  }, [userId]);

  // 選択された盆栽が変更されたら作業記録を取得
  useEffect(() => {
    fetchWorkLogs();
  }, [selectedBonsaiId]);

  // 盆栽選択時の処理
  const handleBonsaiSelect = (bonsaiId) => {
    setSelectedBonsaiId(bonsaiId);
    window.selectedBonsaiId = bonsaiId; // グローバルに保存
    setError(''); // エラーをクリア
  };

  // フォーム入力時の処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 作業記録追加
  const handleAddWorkLog = async (e) => {
    e.preventDefault();
    
    if (!selectedBonsaiId) {
      setError('盆栽を選択してください');
      return;
    }

    if (!formData.work_type) {
      setError('作業種別を選択してください');
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/work-logs/${selectedBonsaiId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: parseInt(userId),
          duration: formData.duration ? parseInt(formData.duration) : null
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setWorkLogs(prev => [result.log, ...prev]); // 新しい記録を先頭に追加
        
        // フォームをリセット
        setFormData({
          date: new Date().toISOString().split('T')[0],
          work_type: '',
          description: '',
          notes: '',
          duration: ''
        });
        setShowAddForm(false);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '作業記録の追加に失敗しました');
      }
    } catch (error) {
      console.error('作業記録追加エラー:', error);
      setError('作業記録の追加に失敗しました');
    }
  };

  // 作業記録削除
  const handleDeleteWorkLog = async (logId) => {
    if (!confirm('この作業記録を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/work-logs/log/${logId}?user_id=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setWorkLogs(prev => prev.filter(log => log.id !== logId));
      } else {
        const errorData = await response.json();
        setError(errorData.error || '作業記録の削除に失敗しました');
      }
    } catch (error) {
      console.error('作業記録削除エラー:', error);
      setError('作業記録の削除に失敗しました');
    }
  };

  // 選択された盆栽の名前を取得
  const getSelectedBonsaiName = () => {
    const selected = bonsaiList.find(b => b.id === selectedBonsaiId);
    return selected ? selected.name : '';
  };

  return (
    <div className="work-log-container">
      <h2>🔨 作業記録</h2>
      
      {error && <div className="error-message">{error}</div>}

      {/* 盆栽選択 */}
      <div className="bonsai-selector">
        <label>盆栽を選択:</label>
        <select 
          value={selectedBonsaiId || ''} 
          onChange={(e) => handleBonsaiSelect(parseInt(e.target.value))}
        >
          <option value="">-- 盆栽を選択してください --</option>
          {bonsaiList.map(bonsai => (
            <option key={bonsai.id} value={bonsai.id}>
              {bonsai.name} ({bonsai.species || '樹種不明'})
            </option>
          ))}
        </select>
      </div>

      {selectedBonsaiId && (
        <>
          {/* 作業記録追加ボタン */}
          <div className="add-log-section">
            <button 
              className="add-log-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? '🔽 フォームを閉じる' : '➕ 作業記録を追加'}
            </button>
          </div>

          {/* 作業記録追加フォーム */}
          {showAddForm && (
            <form className="add-work-log-form" onSubmit={handleAddWorkLog}>
              <h3>作業記録を追加 - {getSelectedBonsaiName()}</h3>
              
              <div className="form-group">
                <label>作業日:</label>
                <input 
                  type="date" 
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>作業種別:</label>
                <select 
                  name="work_type"
                  value={formData.work_type}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">-- 作業種別を選択 --</option>
                  {workTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>作業内容:</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="具体的な作業内容を記録してください"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>メモ・備考:</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="気付いたことや次回への備考など"
                  rows="2"
                />
              </div>

              <div className="form-group">
                <label>作業時間 (分):</label>
                <input 
                  type="number" 
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="作業にかかった時間（分）"
                  min="0"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="submit-btn">📝 記録を追加</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowAddForm(false)}
                >
                  キャンセル
                </button>
              </div>
            </form>
          )}

          {/* 作業記録一覧 */}
          <div className="work-logs-section">
            <h3>作業履歴 - {getSelectedBonsaiName()}</h3>
            
            {loading ? (
              <div className="loading">読み込み中...</div>
            ) : workLogs.length === 0 ? (
              <div className="no-logs">まだ作業記録がありません</div>
            ) : (
              <div className="work-logs-list">
                {workLogs.map(log => (
                  <div key={log.id} className="work-log-item">
                    <div className="log-header">
                      <div className="log-date-type">
                        <span className="log-date">{log.date}</span>
                        <span className="log-type">{log.work_type}</span>
                      </div>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteWorkLog(log.id)}
                        title="削除"
                      >
                        🗑️
                      </button>
                    </div>
                    
                    {log.description && (
                      <div className="log-description">
                        <strong>作業内容:</strong> {log.description}
                      </div>
                    )}
                    
                    {log.notes && (
                      <div className="log-notes">
                        <strong>メモ:</strong> {log.notes}
                      </div>
                    )}
                    
                    {log.duration && (
                      <div className="log-duration">
                        <strong>作業時間:</strong> {log.duration}分
                      </div>
                    )}
                    
                    <div className="log-created">
                      記録日時: {new Date(log.created_at).toLocaleString('ja-JP')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default WorkLog; 