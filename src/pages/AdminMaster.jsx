import React, { useState, useEffect } from 'react';
import './Pages.css';

const AdminMaster = ({ apiBaseUrl, userId }) => {
  const [activeTab, setActiveTab] = useState('pesticides');
  const [data, setData] = useState({
    species: [],
    pesticides: [],
    pestDiseases: [],
    effectiveness: [],
    speciesRisks: [],
    prohibited: []
  });
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // 月名の配列
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // 管理者権限チェック
  useEffect(() => {
    checkAdminStatus();
  }, [apiBaseUrl, userId]);

  // データ取得は管理者権限確認後に実行
  useEffect(() => {
    if (adminCheckComplete && isAdmin) {
      fetchAllData();
    }
  }, [adminCheckComplete, isAdmin]);

  const checkAdminStatus = async () => {
    if (!userId || !apiBaseUrl) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/user/is-admin/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAdmin(data.is_admin);
          if (!data.is_admin) {
            alert('管理者権限が必要です');
          }
        } else {
          setIsAdmin(false);
          alert('権限確認に失敗しました');
        }
      } else {
        setIsAdmin(false);
        alert('権限確認エラー');
      }
    } catch (error) {
      console.error('管理者権限確認エラー:', error);
      setIsAdmin(false);
      alert('権限確認に失敗しました');
    } finally {
      setAdminCheckComplete(true);
    }
  };

  const fetchAllData = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      await Promise.all([
        fetchSpecies(),
        fetchPesticides(),
        fetchPestDiseases(),
        fetchEffectiveness(),
        fetchSpeciesRisks(),
        fetchProhibited(),
        fetchSummary()
      ]);
    } catch (error) {
      console.error('データ取得エラー:', error);
      alert('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const apiCall = async (endpoint, options = {}) => {
    const url = `${apiBaseUrl}/api/admin/master${endpoint}?user_id=${userId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'APIエラー');
    }
    
    return response.json();
  };

  const apiCall_Add = async (endpoint, options = {}) => {
    const url = `${apiBaseUrl}/api/admin/master${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'APIエラー');
    }
    
    return response.json();
  };

  const apiCall_Delete = async (endpoint, options = {}) => {
    const url = `${apiBaseUrl}/api/admin/master${endpoint}?user_id=${userId}`;
    console.log('DELETE request URL:', url);
    
    try {
      const response = await fetch(url, {
        method: 'DELETE',
        ...options
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        console.log('Content type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          const error = await response.json();
          throw new Error(error.error || 'APIエラー');
        } else {
          // HTMLレスポンスの場合
          const htmlText = await response.text();
          console.log('HTML Response:', htmlText.substring(0, 500)); // 最初の500文字を表示
          throw new Error(`サーバーエラー (${response.status}): HTMLレスポンスが返されました`);
        }
      }
      
      return response.json();
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  };
  

  const fetchSpecies = async () => {
    const data = await apiCall('/species');
    setData(prev => ({ ...prev, species: data }));
  };

  const fetchPesticides = async () => {
    const data = await apiCall('/pesticides');
    setData(prev => ({ ...prev, pesticides: data }));
  };

  const fetchPestDiseases = async () => {
    const data = await apiCall('/pest-diseases');
    setData(prev => ({ ...prev, pestDiseases: data }));
  };

  const fetchEffectiveness = async () => {
    const data = await apiCall('/pesticide-effectiveness');
    setData(prev => ({ ...prev, effectiveness: data }));
  };

  const fetchSpeciesRisks = async () => {
    const data = await apiCall('/species-pest-diseases');
    setData(prev => ({ ...prev, speciesRisks: data }));
  };

  const fetchProhibited = async () => {
    const data = await apiCall('/species-prohibited-pesticides');
    setData(prev => ({ ...prev, prohibited: data }));
  };

  const fetchSummary = async () => {
    const data = await apiCall('/summary');
    setSummary(data);
  };

  // 月範囲表示用のヘルパー関数
  const formatMonthRange = (start_month, end_month) => {
    if (!start_month || !end_month) return '未設定';
    if (start_month === end_month) {
      return `${start_month}月`;
    }
    if (start_month <= end_month) {
      return `${start_month}月-${end_month}月`;
    } else {
      // 年をまたぐ場合
      return `${start_month}月-${end_month}月（年またぎ）`;
    }
  };

  const handleAdd = async (endpoint, data) => {
    try {
      await apiCall_Add(endpoint, {
        body: JSON.stringify({ ...data, user_id: userId })
      });
      setShowAddForm(false);
      setFormData({});
      fetchAllData();
      alert('追加が完了しました');
    } catch (error) {
      console.error('追加エラー:', error);
      alert(`追加に失敗しました: ${error.message}`);
    }
  };

  const handleDelete = async (endpoint, id) => {
    if (!window.confirm('削除してもよろしいですか？')) return;
    
    try {
      await apiCall_Delete(`${endpoint}/${id}`);
      fetchAllData();
      alert('削除が完了しました');
    } catch (error) {
      console.error('削除エラー:', error);
      alert(`削除に失敗しました: ${error.message}`);
    }
  };

  const renderPesticidesTab = () => (
    <div className="master-tab-content">
      <div className="master-header">
        <h3>農薬マスタ ({data.pesticides.length}件)</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ type: 'insecticide', interval_days: 14 });
            setShowAddForm('pesticide');
          }}
        >
          農薬追加
        </button>
      </div>

      <div className="master-table">
        <table>
          <thead>
            <tr>
              <th>農薬名</th>
              <th>タイプ</th>
              <th>散布間隔</th>
              <th>有効成分</th>
              <th>説明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.pesticides.map(pesticide => (
              <tr key={pesticide.id}>
                <td>{pesticide.name}</td>
                <td>
                  <span className={`tag ${pesticide.type === 'insecticide' ? 'tag-blue' : 'tag-green'}`}>
                    {pesticide.type === 'insecticide' ? '殺虫剤' : '殺菌剤'}
                  </span>
                </td>
                <td>{pesticide.interval_days}日</td>
                <td>{pesticide.active_ingredient}</td>
                <td>{pesticide.description}</td>
                <td>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete('/pesticides', pesticide.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPestDiseasesTab = () => (
    <div className="master-tab-content">
      <div className="master-header">
        <h3>害虫・病気マスタ ({data.pestDiseases.length}件)</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ type: 'pest', season: '通年' });
            setShowAddForm('pestDisease');
          }}
        >
          害虫・病気追加
        </button>
      </div>

      <div className="master-table">
        <table>
          <thead>
            <tr>
              <th>名前</th>
              <th>タイプ</th>
              <th>発生月範囲</th>
              <th>説明</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.pestDiseases.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <span className={`tag ${item.type === 'pest' ? 'tag-orange' : 'tag-red'}`}>
                    {item.type === 'pest' ? '害虫' : '病気'}
                  </span>
                </td>
                <td>{item.season}</td>
                <td>{item.description}</td>
                <td>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete('/pest-diseases', item.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEffectivenessTab = () => (
    <div className="master-tab-content">
      <div className="master-header">
        <h3>農薬効果マスタ ({data.effectiveness.length}件)</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ effectiveness_level: 3 });
            setShowAddForm('effectiveness');
          }}
        >
          効果関係追加
        </button>
      </div>

      <div className="master-table">
        <table>
          <thead>
            <tr>
              <th>農薬名</th>
              <th>対象害虫・病気</th>
              <th>効果レベル</th>
              <th>備考</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.effectiveness.map(item => (
              <tr key={item.id}>
                <td>{item.pesticide_name}</td>
                <td>{item.pest_disease_name}</td>
                <td>
                  <span className="effectiveness-level">
                    {'★'.repeat(item.effectiveness_level)}
                  </span>
                </td>
                <td>{item.notes}</td>
                <td>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete('/pesticide-effectiveness', item.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSpeciesTab = () => (
    <div className="master-tab-content">
      <div className="master-header">
        <h3>樹種マスタ ({data.species.length}件)</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ category: '針葉樹' });
            setShowAddForm('species');
          }}
        >
          樹種追加
        </button>
      </div>

      <div className="master-table">
        <table>
          <thead>
            <tr>
              <th>樹種名</th>
              <th>学名</th>
              <th>分類</th>
              <th>説明</th>
              <th>管理ポイント</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.species.map(species => (
              <tr key={species.id}>
                <td>{species.name}</td>
                <td><em>{species.scientific_name}</em></td>
                <td>
                  <span className={`tag tag-${species.category === '針葉樹' ? 'green' : species.category === '広葉樹' ? 'blue' : 'orange'}`}>
                    {species.category}
                  </span>
                </td>
                <td>{species.description}</td>
                <td>{species.care_notes}</td>
                <td>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete('/species', species.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSpeciesRisksTab = () => (
    <div className="master-tab-content">
      <div className="master-header">
        <h3>樹種別リスク ({data.speciesRisks.length}件)</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ occurrence_probability: 3, season: '通年' });
            setShowAddForm('speciesRisk');
          }}
        >
          リスク追加
        </button>
      </div>

      <div className="master-table">
        <table>
          <thead>
            <tr>
              <th>樹種</th>
              <th>害虫・病気</th>
              <th>発生確率</th>
              <th>発生月範囲</th>
              <th>備考</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.speciesRisks.map(item => (
              <tr key={item.id}>
                <td>{item.species_name}</td>
                <td>{item.pest_disease_name}</td>
                <td>
                  <span className="effectiveness-level">
                    {'⚠️'.repeat(item.occurrence_probability)}
                  </span>
                </td>
                <td>{formatMonthRange(item.start_month, item.end_month)}</td>
                <td>{item.notes || '-'}</td>
                <td>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete('/species-pest-diseases', item.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderProhibitedTab = () => (
    <div className="master-tab-content">
      <div className="master-header">
        <h3>樹種別NG薬剤 ({data.prohibited.length}件)</h3>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setFormData({ severity: 'warning' });
            setShowAddForm('prohibited');
          }}
        >
          NG薬剤追加
        </button>
      </div>

      <div className="master-table">
        <table>
          <thead>
            <tr>
              <th>樹種</th>
              <th>農薬</th>
              <th>重要度</th>
              <th>理由</th>
              <th>備考</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {data.prohibited.map(prohibited => (
              <tr key={prohibited.id}>
                <td>{prohibited.species_name}</td>
                <td>{prohibited.pesticide_name}</td>
                <td>
                  <span className={`tag ${prohibited.severity === 'prohibited' ? 'tag-red' : 'tag-orange'}`}>
                    {prohibited.severity === 'prohibited' ? '禁止' : '警告'}
                  </span>
                </td>
                <td>{prohibited.reason}</td>
                <td>{prohibited.notes}</td>
                <td>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete('/species-prohibited-pesticides', prohibited.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAddForm = () => {
    if (!showAddForm) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (showAddForm === 'pesticide') {
        handleAdd('/pesticides', formData);
      } else if (showAddForm === 'pestDisease') {
        handleAdd('/pest-diseases', formData);
      } else if (showAddForm === 'effectiveness') {
        handleAdd('/pesticide-effectiveness', formData);
      } else if (showAddForm === 'species') {
        handleAdd('/species', formData);
      } else if (showAddForm === 'speciesRisk') {
        handleAdd('/species-pest-diseases', formData);
      } else if (showAddForm === 'prohibited') {
        handleAdd('/species-prohibited-pesticides', formData);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>
            {showAddForm === 'pesticide' && '農薬追加'}
            {showAddForm === 'pestDisease' && '害虫・病気追加'}
            {showAddForm === 'effectiveness' && '農薬効果追加'}
            {showAddForm === 'species' && '樹種追加'}
            {showAddForm === 'speciesRisk' && 'リスク追加'}
            {showAddForm === 'prohibited' && 'NG薬剤追加'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            {showAddForm === 'pesticide' && (
              <>
                <div className="form-group">
                  <label>農薬名:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>タイプ:</label>
                  <select
                    value={formData.type || 'insecticide'}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="insecticide">殺虫剤</option>
                    <option value="fungicide">殺菌剤</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>散布間隔（日）:</label>
                  <input
                    type="number"
                    value={formData.interval_days || 14}
                    onChange={(e) => setFormData({...formData, interval_days: parseInt(e.target.value)})}
                    required
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>有効成分:</label>
                  <input
                    type="text"
                    value={formData.active_ingredient || ''}
                    onChange={(e) => setFormData({...formData, active_ingredient: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>説明:</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </>
            )}

            {showAddForm === 'pestDisease' && (
              <>
                <div className="form-group">
                  <label>名前:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>タイプ:</label>
                  <select
                    value={formData.type || 'pest'}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="pest">害虫</option>
                    <option value="disease">病気</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>発生開始月:</label>
                  <select
                    value={formData.start_month || 1}
                    onChange={(e) => setFormData({...formData, start_month: parseInt(e.target.value)})}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>発生終了月:</label>
                  <select
                    value={formData.end_month || 12}
                    onChange={(e) => setFormData({...formData, end_month: parseInt(e.target.value)})}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>説明:</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              </>
            )}

            {showAddForm === 'effectiveness' && (
              <>
                <div className="form-group">
                  <label>農薬:</label>
                  <select
                    value={formData.pesticide_id || ''}
                    onChange={(e) => setFormData({...formData, pesticide_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">選択してください</option>
                    {data.pesticides.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>対象害虫・病気:</label>
                  <select
                    value={formData.pest_disease_id || ''}
                    onChange={(e) => setFormData({...formData, pest_disease_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">選択してください</option>
                    {data.pestDiseases.map(pd => (
                      <option key={pd.id} value={pd.id}>{pd.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>効果レベル (1-5):</label>
                  <select
                    value={formData.effectiveness_level || 3}
                    onChange={(e) => setFormData({...formData, effectiveness_level: parseInt(e.target.value)})}
                    required
                  >
                    <option value={1}>1 (低)</option>
                    <option value={2}>2</option>
                    <option value={3}>3 (中)</option>
                    <option value={4}>4</option>
                    <option value={5}>5 (高)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>備考:</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </>
            )}

            {showAddForm === 'species' && (
              <>
                <div className="form-group">
                  <label>樹種名:</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>学名:</label>
                  <input
                    type="text"
                    value={formData.scientific_name || ''}
                    onChange={(e) => setFormData({...formData, scientific_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>分類:</label>
                  <select
                    value={formData.category || '針葉樹'}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="針葉樹">針葉樹</option>
                    <option value="広葉樹">広葉樹</option>
                    <option value="花木">花木</option>
                    <option value="果樹">果樹</option>
                    <option value="その他">その他</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>説明:</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>管理ポイント:</label>
                  <textarea
                    value={formData.care_notes || ''}
                    onChange={(e) => setFormData({...formData, care_notes: e.target.value})}
                  />
                </div>
              </>
            )}

            {showAddForm === 'speciesRisk' && (
              <>
                <div className="form-group">
                  <label>樹種:</label>
                  <select
                    value={formData.species_id || ''}
                    onChange={(e) => setFormData({...formData, species_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">選択してください</option>
                    {data.species.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>害虫・病気:</label>
                  <select
                    value={formData.pest_disease_id || ''}
                    onChange={(e) => setFormData({...formData, pest_disease_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">選択してください</option>
                    {data.pestDiseases.map(pd => (
                      <option key={pd.id} value={pd.id}>{pd.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>発生確率 (1-5):</label>
                  <select
                    value={formData.occurrence_probability || 3}
                    onChange={(e) => setFormData({...formData, occurrence_probability: parseInt(e.target.value)})}
                    required
                  >
                    <option value={1}>1 (低)</option>
                    <option value={2}>2</option>
                    <option value={3}>3 (中)</option>
                    <option value={4}>4</option>
                    <option value={5}>5 (高)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>発生開始月:</label>
                  <select
                    value={formData.start_month || 1}
                    onChange={(e) => setFormData({...formData, start_month: parseInt(e.target.value)})}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>発生終了月:</label>
                  <select
                    value={formData.end_month || 12}
                    onChange={(e) => setFormData({...formData, end_month: parseInt(e.target.value)})}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}月</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>備考:</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </>
            )}

            {showAddForm === 'prohibited' && (
              <>
                <div className="form-group">
                  <label>樹種:</label>
                  <select
                    value={formData.species_id || ''}
                    onChange={(e) => setFormData({...formData, species_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">選択してください</option>
                    {data.species.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>農薬:</label>
                  <select
                    value={formData.pesticide_id || ''}
                    onChange={(e) => setFormData({...formData, pesticide_id: parseInt(e.target.value)})}
                    required
                  >
                    <option value="">選択してください</option>
                    {data.pesticides.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>重要度:</label>
                  <select
                    value={formData.severity || 'warning'}
                    onChange={(e) => setFormData({...formData, severity: e.target.value})}
                  >
                    <option value="warning">警告</option>
                    <option value="prohibited">禁止</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>理由:</label>
                  <textarea
                    value={formData.reason || ''}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>備考:</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">追加</button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({});
                }}
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (!adminCheckComplete) {
    return <div className="loading">権限を確認中...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="admin-master">
        <div className="error-message">
          <h2>アクセス拒否</h2>
          <p>このページにアクセスするには管理者権限が必要です。</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">マスタデータを読み込み中...</div>;
  }

  return (
    <div className="admin-master">
      <div className="admin-header">
        <h1>🛠️ マスタデータ管理</h1>
        <div className="summary-cards">
          <button className="summary-card" onClick={() => setActiveTab('species')}>
            <h4>樹種</h4>
            <span className="count">{summary.species_count}</span>
          </button>
          <button className="summary-card" onClick={() => setActiveTab('pesticides')}>
            <h4>農薬</h4>
            <span className="count">{summary.pesticides_count}</span>
          </button>
          <button className="summary-card" onClick={() => setActiveTab('pestDiseases')}>
            <h4>害虫・病気</h4>
            <span className="count">{summary.pest_diseases_count}</span>
          </button>
          <button className="summary-card" onClick={() => setActiveTab('effectiveness')}>
            <h4>農薬効果</h4>
            <span className="count">{summary.effectiveness_count}</span>
          </button>
          <button className="summary-card" onClick={() => setActiveTab('speciesRisk')}>
            <h4>樹種別リスク</h4>
            <span className="count">{summary.species_risks_count}</span>
          </button>
          <button className="summary-card" onClick={() => setActiveTab('prohibited')}>
            <h4>NG薬剤</h4>
            <span className="count">{summary.prohibited_count}</span>
          </button>
        </div>
      </div>

        <div className="master-tabs">
        <button 
          className={`tab ${activeTab === 'species' ? 'active' : ''}`}
          onClick={() => setActiveTab('species')}
        >
          樹種マスタ
        </button>
        <button 
          className={`tab ${activeTab === 'pesticides' ? 'active' : ''}`}
          onClick={() => setActiveTab('pesticides')}
        >
          農薬マスタ
        </button>
        <button 
          className={`tab ${activeTab === 'pestDiseases' ? 'active' : ''}`}
          onClick={() => setActiveTab('pestDiseases')}
        >
          害虫・病気マスタ
        </button>
        <button 
          className={`tab ${activeTab === 'effectiveness' ? 'active' : ''}`}
          onClick={() => setActiveTab('effectiveness')}
        >
          農薬効果マスタ
        </button>
        <button 
          className={`tab ${activeTab === 'speciesRisk' ? 'active' : ''}`}
          onClick={() => setActiveTab('speciesRisk')}
        >
          樹種別リスク
        </button>
        <button 
          className={`tab ${activeTab === 'prohibited' ? 'active' : ''}`}
          onClick={() => setActiveTab('prohibited')}
        >
          樹種別NG薬剤
        </button>
      </div>

      {activeTab === 'species' && renderSpeciesTab()}
      {activeTab === 'pesticides' && renderPesticidesTab()}
      {activeTab === 'pestDiseases' && renderPestDiseasesTab()}
      {activeTab === 'effectiveness' && renderEffectivenessTab()}
      {activeTab === 'speciesRisk' && renderSpeciesRisksTab()}
      {activeTab === 'prohibited' && renderProhibitedTab()}

      {renderAddForm()}
    </div>
  );
};

export default AdminMaster; 