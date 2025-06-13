import { useState, useEffect } from 'react';
import './PesticideLog.css';


const PesticideLog = ({ apiBaseUrl, userId }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [monthlyRisks, setMonthlyRisks] = useState(null);
  const [bonsaiInfo, setBonsaiInfo] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userBonsaiList, setUserBonsaiList] = useState([]);
  const [pesticideList, setPesticideList] = useState([]);
  const [selectedPesticide, setSelectedPesticide] = useState('');
  const [customPesticide, setCustomPesticide] = useState('');
  const [useCustomPesticide, setUseCustomPesticide] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [newLog, setNewLog] = useState({
    pesticide_name: '',
    usage_date: new Date().toISOString().split('T')[0],
    dosage: '',
    water_amount: '',
    dilution_ratio: '',
    notes: ''
  });

  // 殺虫剤と殺菌剤の同時追加用ステート
  const [newLogs, setNewLogs] = useState({
    insecticide: {
      enabled: false,
      pesticide_name: '',
      usage_date: new Date().toISOString().split('T')[0],
      dosage: '',
      water_amount: '',
      water_amount_custom: '',
      use_custom_water: false,
      dilution_ratio: '',
      dilution_ratio_custom: '',
      use_custom_dilution: false,
      notes: '',
      useCustomName: false,
      customName: ''
    },
    fungicide: {
      enabled: false,
      pesticide_name: '',
      usage_date: new Date().toISOString().split('T')[0],
      dosage: '',
      water_amount: '',
      water_amount_custom: '',
      use_custom_water: false,
      dilution_ratio: '',
      dilution_ratio_custom: '',
      use_custom_dilution: false,
      notes: '',
      useCustomName: false,
      customName: ''
    }
  });

  // 水の量の選択肢
  const waterAmountOptions = [
    { value: '100', label: '100ml' },
    { value: '200', label: '200ml' },
    { value: '500', label: '500ml' },
    { value: '1000', label: '1L (1000ml)' },
    { value: '2000', label: '2L (2000ml)' },
    { value: '5000', label: '5L (5000ml)' },
    { value: 'custom', label: 'その他（手入力）' }
  ];

  // 希釈比の選択肢
  const dilutionRatioOptions = [
    { value: '100', label: '100倍' },
    { value: '200', label: '200倍' },
    { value: '500', label: '500倍' },
    { value: '1000', label: '1000倍' },
    { value: '2000', label: '2000倍' },
    { value: '3000', label: '3000倍' },
    { value: '5000', label: '5000倍' },
    { value: 'custom', label: 'その他（手入力）' }
  ];

  // 現在選択されている盆栽のID
  const [bonsaiId, setBonsaiId] = useState(window.selectedBonsaiId);

  // 月名の配列
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // 月次リスクと推奨農薬を取得
  const fetchMonthlyRisks = async () => {
    if (!bonsaiId) return;
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/pesticides/monthly-risks/${bonsaiId}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '月次リスクの取得に失敗しました');
      }

      const data = await response.json();
      setMonthlyRisks(data);
    } catch (err) {
      console.error('月次リスク取得エラー:', err);
      setError(err.message || '月次リスクの取得中にエラーが発生しました。');
    }
  };

  // 農薬リストを取得（マスタデータベースから）
  const fetchPesticideList = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/pesticides/list?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPesticideList(data);
      } else {
        // フォールバック用のデフォルトリスト
        setPesticideList([
          { id: 1, name: "オルトラン", type: "insecticide", description: "汎用殺虫剤" },
          { id: 2, name: "スミチオン", type: "insecticide", description: "速効性殺虫剤" },
          { id: 3, name: "トップジンM", type: "fungicide", description: "系統殺菌剤" }
        ]);
      }
    } catch (err) {
      console.error('農薬リスト取得エラー:', err);
      setPesticideList([
        { id: 1, name: "オルトラン", type: "insecticide", description: "汎用殺虫剤" },
        { id: 2, name: "スミチオン", type: "insecticide", description: "速効性殺虫剤" },
        { id: 3, name: "トップジンM", type: "fungicide", description: "系統殺菌剤" }
      ]);
    }
  };

  // 農薬記録を削除する関数
  const handleDeleteLog = async (logId) => {
    if (!window.confirm('この農薬記録を削除してもよろしいですか？')) {
      return;
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/pesticides/log/${logId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '農薬記録の削除に失敗しました');
      }

      // 削除成功後、記録一覧を更新
      if (bonsaiId) {
        fetchPesticideLogs();
        fetchMonthlyRisks(); // 推奨も更新
      } else {
        fetchAllUserLogs();
      }
      
    } catch (err) {
      console.error('農薬記録削除エラー:', err);
      setError(err.message || '農薬記録の削除中にエラーが発生しました。');
      
      // 権限エラーの場合は選択をクリア
      if (err.message.includes('権限がありません')) {
        window.selectedBonsaiId = null;
        setBonsaiId(null);
      }
    }
  };

  // ページ読み込み時の処理
  useEffect(() => {
    const checkBonsaiId = async () => {
      // URLパラメータから盆栽IDを取得
      const params = new URLSearchParams(window.location.search);
      const urlBonsaiId = params.get('bonsai_id');
      
      // グローバル変数から盆栽IDを取得
      const globalBonsaiId = window.selectedBonsaiId;
      
      const targetId = urlBonsaiId || globalBonsaiId;
      
      if (targetId) {
        setBonsaiId(targetId);
      } else {
        console.log('盆栽IDが設定されていません。全体記録を表示します。');
        setBonsaiId(null);
      }
    };

    checkBonsaiId();
  }, []);

  // 盆栽IDが変更されたときの処理
  useEffect(() => {
    if (userId) {
      if (bonsaiId) {
        fetchPesticideLogs();
        fetchMonthlyRisks();
        fetchPesticideList();
        fetchBonsaiInfo();
        fetchRecommendation(); // 推奨情報も取得
      } else {
        fetchAllUserLogs();
        fetchUserBonsaiList();
      }
    }
  }, [bonsaiId, userId, apiBaseUrl]);

  // ユーザーの盆栽一覧を取得
  const fetchUserBonsaiList = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('盆栽データの取得に失敗しました');
      }

      const data = await response.json();
      setUserBonsaiList(data);
      
      // 盆栽IDの有効性を再確認
      if (bonsaiId && !data.some(bonsai => bonsai.id === bonsaiId)) {
        window.selectedBonsaiId = null;
        setBonsaiId(null);
      }
    } catch (err) {
      console.error('盆栽一覧取得エラー:', err);
      setError('盆栽一覧の取得中にエラーが発生しました。');
    }
  };

  // 盆栽情報を取得
  const fetchBonsaiInfo = async () => {
    if (!bonsaiId) return;
    
    // 既に取得済みのユーザー盆栽リストから情報を取得
    if (userBonsaiList.length > 0) {
      const currentBonsai = userBonsaiList.find(b => b.id === bonsaiId);
      if (currentBonsai) {
        setBonsaiInfo(currentBonsai);
        return;
      }
    }
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai/${bonsaiId}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '盆栽情報の取得に失敗しました');
      }

      const data = await response.json();
      setBonsaiInfo(data);
    } catch (err) {
      console.error('盆栽情報取得エラー:', err);
      setError(err.message || '盆栽情報の取得中にエラーが発生しました。');
      // エラーが起きた場合は選択をクリア
      window.selectedBonsaiId = null;
      setBonsaiId(null);
    }
  };

  // 農薬記録を取得
  const fetchPesticideLogs = async () => {
    if (!bonsaiId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/pesticides/${bonsaiId}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '農薬記録の取得に失敗しました');
      }

      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error('農薬記録取得エラー:', err);
      setError(err.message || '農薬記録の取得中にエラーが発生しました。');
      // エラーが起きた場合は選択をクリア
      if (err.message.includes('権限がありません') || err.message.includes('見つかりません')) {
        window.selectedBonsaiId = null;
        setBonsaiId(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 全体のログを取得（盆栽が選択されていない場合）
  const fetchAllUserLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/pesticides/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('農薬記録の取得に失敗しました');
      }

      const data = await response.json();
      setLogs(data);
      setError(null);
    } catch (err) {
      console.error('農薬記録取得エラー:', err);
      setError('農薬記録の取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // フォーム入力の処理
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLog(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 新しいフォーム用の入力処理
  const handleNewLogChange = (type, field, value) => {
    setNewLogs(prev => {
      const updated = {
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value
        }
      };

      // 薬剤量の自動計算
      if (field === 'pesticide_name' || field === 'customName' || 
          field === 'water_amount' || field === 'water_amount_custom' ||
          field === 'dilution_ratio' || field === 'dilution_ratio_custom') {
        
        const currentData = updated[type];
        
        // 水の量を取得（カスタム入力かどうかで分岐）
        let waterAmount = '';
        if (currentData.water_amount === 'custom') {
          waterAmount = currentData.water_amount_custom;
        } else {
          waterAmount = currentData.water_amount;
        }
        
        // 希釈比を取得（カスタム入力かどうかで分岐）
        let dilutionRatio = '';
        if (currentData.dilution_ratio === 'custom') {
          dilutionRatio = currentData.dilution_ratio_custom;
        } else {
          dilutionRatio = currentData.dilution_ratio;
        }
        
        // 自動計算を実行（水の量と希釈比が揃っている場合のみ）
        if (waterAmount && dilutionRatio && 
            waterAmount !== 'custom' && dilutionRatio !== 'custom' &&
            !isNaN(parseFloat(waterAmount)) && !isNaN(parseFloat(dilutionRatio))) {
          const calculatedAmount = calculatePesticideAmount('dummy', waterAmount, dilutionRatio);
          updated[type].dosage = calculatedAmount;
        }
      }

      return updated;
    });
  };

  // 農薬タイプの有効/無効切り替え
  const togglePesticideType = (type) => {
    setNewLogs(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        enabled: !prev[type].enabled
      }
    }));
  };

  // フォームリセット
  const resetNewLogsForm = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    setNewLogs({
      insecticide: {
        enabled: false,
        pesticide_name: '',
        usage_date: currentDate,
        dosage: '',
        water_amount: '',
        water_amount_custom: '',
        use_custom_water: false,
        dilution_ratio: '',
        dilution_ratio_custom: '',
        use_custom_dilution: false,
        notes: '',
        useCustomName: false,
        customName: ''
      },
      fungicide: {
        enabled: false,
        pesticide_name: '',
        usage_date: currentDate,
        dosage: '',
        water_amount: '',
        water_amount_custom: '',
        use_custom_water: false,
        dilution_ratio: '',
        dilution_ratio_custom: '',
        use_custom_dilution: false,
        notes: '',
        useCustomName: false,
        customName: ''
      }
    });
  };

  // 詳細農薬記録を追加
  const handleAddEnhancedLog = async (e) => {
    e.preventDefault();
    
    if (!bonsaiId) {
      setError('盆栽が選択されていません。');
      return;
    }

    const finalPesticideName = useCustomPesticide ? customPesticide : selectedPesticide;
    
    if (!finalPesticideName) {
      setError('農薬名を選択または入力してください。');
      return;
    }

    try {
      const logData = {
        bonsai_id: parseInt(bonsaiId),
        pesticide_name: finalPesticideName,
        usage_date: newLog.usage_date,
        dosage: newLog.dosage,
        water_amount: newLog.water_amount,
        dilution_ratio: newLog.dilution_ratio,
        notes: newLog.notes
      };

      const response = await fetch(`${apiBaseUrl}/api/pesticides/enhanced-log?user_id=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '農薬記録の追加に失敗しました');
      }

      // フォームをリセット
      setNewLog({
        pesticide_name: '',
        usage_date: new Date().toISOString().split('T')[0],
        dosage: '',
        water_amount: '',
        dilution_ratio: '',
        notes: ''
      });
      setSelectedPesticide('');
      setCustomPesticide('');
      setUseCustomPesticide(false);
      setShowAddForm(false);
      
      // データを再取得
      fetchPesticideLogs();
      fetchMonthlyRisks(); // 推奨も更新
      fetchRecommendation(); // 推奨情報も更新
      
    } catch (err) {
      console.error('農薬記録追加エラー:', err);
      setError(err.message || '農薬記録の追加中にエラーが発生しました。');
    }
  };

  // 殺虫剤と殺菌剤の同時追加処理
  const handleAddDualLogs = async (e) => {
    e.preventDefault();
    
    if (!bonsaiId) {
      setError('盆栽が選択されていません。');
      return;
    }

    const logsToAdd = [];

    // 殺虫剤が有効な場合
    if (newLogs.insecticide.enabled) {
      const insecticideName = newLogs.insecticide.useCustomName ? 
        newLogs.insecticide.customName : 
        newLogs.insecticide.pesticide_name;
      
      if (!insecticideName) {
        setError('殺虫剤名を選択または入力してください。');
        return;
      }

      // 水の量を取得（カスタム入力かどうかで分岐）
      const waterAmount = newLogs.insecticide.water_amount === 'custom' ? 
        newLogs.insecticide.water_amount_custom : 
        newLogs.insecticide.water_amount;

      // 希釈比を取得（カスタム入力かどうかで分岐）
      const dilutionRatio = newLogs.insecticide.dilution_ratio === 'custom' ? 
        newLogs.insecticide.dilution_ratio_custom : 
        newLogs.insecticide.dilution_ratio;

      logsToAdd.push({
        bonsai_id: parseInt(bonsaiId),
        pesticide_name: insecticideName,
        usage_date: newLogs.insecticide.usage_date,
        dosage: newLogs.insecticide.dosage,
        water_amount: waterAmount,
        dilution_ratio: dilutionRatio,
        notes: newLogs.insecticide.notes
      });
    }

    // 殺菌剤が有効な場合
    if (newLogs.fungicide.enabled) {
      const fungicideName = newLogs.fungicide.useCustomName ? 
        newLogs.fungicide.customName : 
        newLogs.fungicide.pesticide_name;
      
      if (!fungicideName) {
        setError('殺菌剤名を選択または入力してください。');
        return;
      }

      // 水の量を取得（カスタム入力かどうかで分岐）
      const waterAmount = newLogs.fungicide.water_amount === 'custom' ? 
        newLogs.fungicide.water_amount_custom : 
        newLogs.fungicide.water_amount;

      // 希釈比を取得（カスタム入力かどうかで分岐）
      const dilutionRatio = newLogs.fungicide.dilution_ratio === 'custom' ? 
        newLogs.fungicide.dilution_ratio_custom : 
        newLogs.fungicide.dilution_ratio;

      logsToAdd.push({
        bonsai_id: parseInt(bonsaiId),
        pesticide_name: fungicideName,
        usage_date: newLogs.fungicide.usage_date,
        dosage: newLogs.fungicide.dosage,
        water_amount: waterAmount,
        dilution_ratio: dilutionRatio,
        notes: newLogs.fungicide.notes
      });
    }

    if (logsToAdd.length === 0) {
      setError('殺虫剤または殺菌剤のどちらかを有効にしてください。');
      return;
    }

    try {
      // 複数の農薬記録を順次追加
      for (const logData of logsToAdd) {
        const response = await fetch(`${apiBaseUrl}/api/pesticides/enhanced-log?user_id=${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '農薬記録の追加に失敗しました');
        }
      }

      // フォームをリセット
      resetNewLogsForm();
      setShowAddForm(false);
      
      // データを再取得
      fetchPesticideLogs();
      fetchMonthlyRisks(); // 推奨も更新
      fetchRecommendation(); // 推奨情報も更新
      
    } catch (err) {
      console.error('農薬記録追加エラー:', err);
      setError(err.message || '農薬記録の追加中にエラーが発生しました。');
    }
  };

  const navigateToBonsaiList = () => {
    window.selectedBonsaiId = bonsaiId;
    window.selectedBonsaiUserId = userId;
    window.setCurrentPage('bonsai-list');
  };

  // 信頼度に応じたアイコン表示
  const getConfidenceIcon = (confidence) => {
    switch (confidence) {
      case '高':
        return '🟢';
      case '中':
        return '🟡';
      case '低':
        return '🔴';
      default:
        return '🔵';
    }
  };

  // 詳細記録フォームのレンダリング
  const renderEnhancedForm = () => (
    <div className="add-form-container enhanced-form">
      <h2>💊 農薬記録を追加</h2>
      <form onSubmit={handleAddEnhancedLog} className="pesticide-form">
        
        <div className="form-section">
          <h3>農薬選択</h3>
          
          <div className="pesticide-selection">
            <div className="selection-toggle">
              <label>
                <input
                  type="radio"
                  checked={!useCustomPesticide}
                  onChange={() => setUseCustomPesticide(false)}
                />
                推奨から選択
              </label>
              <label>
                <input
                  type="radio"
                  checked={useCustomPesticide}
                  onChange={() => setUseCustomPesticide(true)}
                />
                任意入力
              </label>
            </div>

            {!useCustomPesticide ? (
              <div className="form-group">
                <label htmlFor="pesticide_name">農薬名 *</label>
                <select
                  id="pesticide_name"
                  value={selectedPesticide}
                  onChange={(e) => setSelectedPesticide(e.target.value)}
                  required
                  className="pesticide-select"
                >
                  <option value="">農薬を選択</option>
                  {pesticideList.map(pesticide => (
                    <option key={pesticide.id} value={pesticide.name}>
                      {pesticide.name} 
                      {pesticide.description && ` (${pesticide.description})`}
                      {pesticide.type && ` [${pesticide.type === 'insecticide' ? '殺虫剤' : '殺菌剤'}]`}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="custom_pesticide">農薬名 (任意入力) *</label>
                <input
                  type="text"
                  id="custom_pesticide"
                  value={customPesticide}
                  onChange={(e) => setCustomPesticide(e.target.value)}
                  placeholder="農薬名を入力"
                  required
                />
              </div>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>使用情報</h3>
          
          <div className="form-group">
            <label htmlFor="usage_date">使用日 *</label>
            <input
              type="date"
              id="usage_date"
              name="usage_date"
              value={newLog.usage_date}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="dosage">使用量</label>
            <input
              type="text"
              id="dosage"
              name="dosage"
              value={newLog.dosage}
              onChange={handleInputChange}
              placeholder="例: 5ml/L"
            />
          </div>
        </div>

        <div className="form-section">
          <h3>詳細記録</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="water_amount">水の量</label>
              <select
                id="water_amount"
                value={newLog.water_amount}
                onChange={(e) => handleInputChange({ target: { name: 'water_amount', value: e.target.value } })}
                required
              >
                <option value="">水の量を選択</option>
                {waterAmountOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="dilution_ratio">希釈比</label>
              <select
                id="dilution_ratio"
                value={newLog.dilution_ratio}
                onChange={(e) => handleInputChange({ target: { name: 'dilution_ratio', value: e.target.value } })}
                required
              >
                <option value="">希釈比を選択</option>
                {dilutionRatioOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">メモ</label>
            <textarea
              id="notes"
              name="notes"
              value={newLog.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="症状、効果、その他メモ"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-button">記録を追加</button>
          <button 
            type="button" 
            className="cancel-button"
            onClick={() => setShowAddForm(false)}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );

  // 新しい殺虫剤・殺菌剤同時追加フォーム
  const renderDualPesticideForm = () => {
    const renderPesticideSection = (type, title, icon, color) => {
      const data = newLogs[type];
      const isInsecticide = type === 'insecticide';
      const pesticideOptions = pesticideList.filter(p => 
        isInsecticide ? p.type === 'insecticide' : p.type === 'fungicide'
      );

      return (
        <div className={`pesticide-section ${type}`} style={{ borderColor: color }}>
          <div className="section-header">
            <label className="section-toggle">
              <input
                type="checkbox"
                checked={data.enabled}
                onChange={() => togglePesticideType(type)}
              />
              <span className="section-title" style={{ color: color }}>
                {icon} {title}
              </span>
            </label>
          </div>

          {data.enabled && (
            <div className="section-content">
              <div className="pesticide-selection">
                <div className="selection-toggle">
                  <label>
                    <input
                      type="radio"
                      checked={!data.useCustomName}
                      onChange={() => handleNewLogChange(type, 'useCustomName', false)}
                    />
                    推奨から選択
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={data.useCustomName}
                      onChange={() => handleNewLogChange(type, 'useCustomName', true)}
                    />
                    任意入力
                  </label>
                </div>

                {!data.useCustomName ? (
                  <div className="form-group">
                    <label>農薬名 *</label>
                    <select
                      value={data.pesticide_name}
                      onChange={(e) => handleNewLogChange(type, 'pesticide_name', e.target.value)}
                      required
                      className="pesticide-select"
                    >
                      <option value="">農薬を選択</option>
                      {pesticideOptions.map(pesticide => (
                        <option key={pesticide.id} value={pesticide.name}>
                          {pesticide.name} 
                          {pesticide.description && ` (${pesticide.description})`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>農薬名 (任意入力) *</label>
                    <input
                      type="text"
                      value={data.customName}
                      onChange={(e) => handleNewLogChange(type, 'customName', e.target.value)}
                      placeholder="農薬名を入力"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>使用日 *</label>
                  <input
                    type="date"
                    value={data.usage_date}
                    onChange={(e) => handleNewLogChange(type, 'usage_date', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>水の量 *</label>
                  <select
                    value={data.water_amount}
                    onChange={(e) => handleNewLogChange(type, 'water_amount', e.target.value)}
                    required
                  >
                    <option value="">水の量を選択</option>
                    {waterAmountOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {data.water_amount === 'custom' && (
                    <input
                      type="text"
                      value={data.water_amount_custom}
                      onChange={(e) => handleNewLogChange(type, 'water_amount_custom', e.target.value)}
                      placeholder="例: 750ml"
                      className="custom-input"
                      required
                    />
                  )}
                </div>
                <div className="form-group">
                  <label>希釈比 *</label>
                  <select
                    value={data.dilution_ratio}
                    onChange={(e) => handleNewLogChange(type, 'dilution_ratio', e.target.value)}
                    required
                  >
                    <option value="">希釈比を選択</option>
                    {dilutionRatioOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {data.dilution_ratio === 'custom' && (
                    <input
                      type="text"
                      value={data.dilution_ratio_custom}
                      onChange={(e) => handleNewLogChange(type, 'dilution_ratio_custom', e.target.value)}
                      placeholder="例: 1500"
                      className="custom-input"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>薬剤使用量 {data.dosage && '(水量÷希釈倍率で自動計算)'}</label>
                  <div className={`dosage-field ${data.dosage ? 'has-calculation' : ''}`}>
                    <input
                      type="text"
                      value={data.dosage}
                      onChange={(e) => handleNewLogChange(type, 'dosage', e.target.value)}
                      placeholder="水量と希釈倍率から自動計算されます"
                      className={data.dosage ? 'auto-calculated' : ''}
                    />
                  </div>
                  {data.dosage && (
                    <small className="calculation-note">
                      ※ 水量÷希釈倍率で自動計算されました。必要に応じて調整してください。
                    </small>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>メモ</label>
                <textarea
                  value={data.notes}
                  onChange={(e) => handleNewLogChange(type, 'notes', e.target.value)}
                  rows="2"
                  placeholder="症状、効果、その他メモ"
                />
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="add-form-container dual-pesticide-form">
        <h2>🧪 農薬記録を追加</h2>
        <form onSubmit={handleAddDualLogs} className="dual-pesticide-form">
          
          <div className="dual-sections">
            {renderPesticideSection('insecticide', '殺虫剤', '🐛', '#f59e0b')}
            {renderPesticideSection('fungicide', '殺菌剤', '🦠', '#8b5cf6')}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="submit-button">記録を追加</button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => setShowAddForm(false)}
            >
              キャンセル
            </button>
          </div>
        </form>
      </div>
    );
  };

  // 月次リスク表示コンポーネント
  const renderMonthlyRisks = () => {
    if (!monthlyRisks) return null;

    const { current_month, next_month, disclaimer } = monthlyRisks;

    return (
      <div className="monthly-risks-container">

        <div className="risk-analysis-grid">
          {/* 当月のリスク */}
          <div className="risk-month-card">
            <h3>📅 {monthNames[current_month.month - 1]} ({current_month.season})</h3>
            
            {current_month.risks.length > 0 ? (
              <div>
                <h4>🐛 想定される害虫・病気</h4>
                <div className="risks-list">
                  {current_month.risks.map((risk, idx) => (
                    <div key={idx} className="risk-item">
                      <span className={`risk-badge ${risk.pest_disease_type}`}>
                        {risk.pest_disease_name}
                      </span>
                      <span className="occurrence-level">
                        {'⚠️'.repeat(risk.occurrence_probability)}
                      </span>
                    </div>
                  ))}
                </div>

                <h4>💊 推奨される農薬</h4>
                <div className="recommendations-list">
                  {current_month.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="recommendation-item" 
                         onClick={() => {
                           if (!useCustomPesticide) {
                             setSelectedPesticide(rec.pesticide_name);
                           }
                         }}>
                      <div className="pesticide-name">{rec.pesticide_name}</div>
                      <div className="pesticide-details">
                        <span className={`type-badge ${rec.pesticide_type}`}>
                          {rec.pesticide_type === 'insecticide' ? '殺虫剤' : '殺菌剤'}
                        </span>
                        <span className="effectiveness">効果: {'★'.repeat(Math.round(rec.avg_effectiveness))}</span>
                        {rec.warning && <span className="warning">⚠️ {rec.warning}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="no-risks">特に注意すべき害虫・病気はありません</p>
            )}
          </div>

          {/* 翌月のリスク */}
          <div className="risk-month-card">
            <h3>📅 {monthNames[next_month.month - 1]} ({next_month.season})</h3>
            
            {next_month.risks.length > 0 ? (
              <div>
                <h4>🐛 想定される害虫・病気</h4>
                <div className="risks-list">
                  {next_month.risks.slice(0, 3).map((risk, idx) => (
                    <div key={idx} className="risk-item">
                      <span className={`risk-badge ${risk.pest_disease_type}`}>
                        {risk.pest_disease_name}
                      </span>
                      <span className="occurrence-level">
                        {'⚠️'.repeat(risk.occurrence_probability)}
                      </span>
                    </div>
                  ))}
                </div>

                <h4>💊 推奨される農薬</h4>
                <div className="recommendations-list">
                  {next_month.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="recommendation-item">
                      <div className="pesticide-name">{rec.pesticide_name}</div>
                      <div className="pesticide-details">
                        <span className={`type-badge ${rec.pesticide_type}`}>
                          {rec.pesticide_type === 'insecticide' ? '殺虫剤' : '殺菌剤'}
                        </span>
                        <span className="effectiveness">効果: {'★'.repeat(Math.round(rec.avg_effectiveness))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="no-risks">特に注意すべき害虫・病気はありません</p>
            )}
          </div>
        </div>

        {/* 免責事項 */}
        <div className="disclaimer-box">
          <h4>⚠️ 重要な注意事項</h4>
          <ul>
            <li>✓ {disclaimer.combination_warning}</li>
            <li>✓ {disclaimer.concentration_warning}</li>
          </ul>
        </div>
      </div>
    );
  };

  // 農薬推奨情報を取得
  const fetchRecommendation = async () => {
    if (!bonsaiId) return;
    
    try {
      setRecommendationLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/pesticides/recommendation/${bonsaiId}?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '推奨情報の取得に失敗しました');
      }

      const data = await response.json();
      setRecommendation(data);
    } catch (err) {
      console.error('推奨情報取得エラー:', err);
      setRecommendation(null);
    } finally {
      setRecommendationLoading(false);
    }
  };

  // 推奨農薬表示エリアのレンダリング
  const renderRecommendationSummary = () => {
    if (!bonsaiId) return null;

    return (
      <div className="recommendation-summary">
        <h2>🎯 農薬推奨情報</h2>
        <div className="summary-cards">
          {recommendationLoading ? (
            <div className="pesticide-recommendations loading">
              <div className="summary-card recommendation-card loading">
                <h4>殺虫剤推奨</h4>
                <span className="loading-text">分析中...</span>
              </div>
              <div className="summary-card recommendation-card loading">
                <h4>殺菌剤推奨</h4>
                <span className="loading-text">分析中...</span>
              </div>
            </div>
          ) : recommendation ? (
            <div className="pesticide-recommendations">
              {/* 殺虫剤推奨 */}
              <div className={`summary-card recommendation-card insecticide ${recommendation.insecticide?.confidence === '高' ? 'high-confidence' : recommendation.insecticide?.confidence === '中' ? 'medium-confidence' : 'low-confidence'}`}>
                <div className="card-header">
                  <h4>🐛 殺虫剤推奨</h4>
                  <span className={`confidence-badge ${recommendation.insecticide?.confidence || 'unknown'}`}>
                    {getConfidenceIcon(recommendation.insecticide?.confidence)} {recommendation.insecticide?.confidence || '不明'}信頼度
                  </span>
                </div>
                
                <div className="recommendation-content">
                  <div className="pesticide-name-large">{recommendation.insecticide?.recommendation || '推奨なし'}</div>
                  
                  {recommendation.insecticide?.pesticide_type && (
                    <span className={`type-badge ${recommendation.insecticide.pesticide_type}`}>
                      殺虫剤
                    </span>
                  )}
                  
                  <div className="recommendation-details">
                    <div className="detail-item">
                      <span className="label">理由:</span>
                      <span className="value">{recommendation.insecticide?.reason || '情報なし'}</span>
                    </div>
                    
                    {recommendation.insecticide?.interval_days && (
                      <div className="detail-item">
                        <span className="label">散布間隔:</span>
                        <span className="value">{recommendation.insecticide.interval_days}日間隔</span>
                      </div>
                    )}
                    
                    {recommendation.insecticide?.effectiveness && (
                      <div className="detail-item">
                        <span className="label">効果レベル:</span>
                        <span className="value">{'★'.repeat(Math.round(recommendation.insecticide.effectiveness))}</span>
                      </div>
                    )}
                    
                    {recommendation.insecticide?.next_application_date && (
                      <div className="detail-item">
                        <span className="label">次回推奨日:</span>
                        <span className="value">{new Date(recommendation.insecticide.next_application_date).toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                  </div>

                  {recommendation.insecticide?.target_pests && recommendation.insecticide.target_pests.length > 0 && (
                    <div className="target-pests">
                      <span className="label">対象害虫:</span>
                      <div className="pests-list">
                        {recommendation.insecticide.target_pests.slice(0, 3).map((pest, idx) => (
                          <span key={idx} className="pest-tag">{pest}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendation.insecticide?.warning && (
                    <div className="warning-message">
                      <span className="warning-icon">⚠️</span>
                      <span className="warning-text">{recommendation.insecticide.warning}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 殺菌剤推奨 */}
              <div className={`summary-card recommendation-card fungicide ${recommendation.fungicide?.confidence === '高' ? 'high-confidence' : recommendation.fungicide?.confidence === '中' ? 'medium-confidence' : 'low-confidence'}`}>
                <div className="card-header">
                  <h4>🦠 殺菌剤推奨</h4>
                  <span className={`confidence-badge ${recommendation.fungicide?.confidence || 'unknown'}`}>
                    {getConfidenceIcon(recommendation.fungicide?.confidence)} {recommendation.fungicide?.confidence || '不明'}信頼度
                  </span>
                </div>
                
                <div className="recommendation-content">
                  <div className="pesticide-name-large">{recommendation.fungicide?.recommendation || '推奨なし'}</div>
                  
                  {recommendation.fungicide?.pesticide_type && (
                    <span className={`type-badge ${recommendation.fungicide.pesticide_type}`}>
                      殺菌剤
                    </span>
                  )}
                  
                  <div className="recommendation-details">
                    <div className="detail-item">
                      <span className="label">理由:</span>
                      <span className="value">{recommendation.fungicide?.reason || '情報なし'}</span>
                    </div>
                    
                    {recommendation.fungicide?.interval_days && (
                      <div className="detail-item">
                        <span className="label">散布間隔:</span>
                        <span className="value">{recommendation.fungicide.interval_days}日間隔</span>
                      </div>
                    )}
                    
                    {recommendation.fungicide?.effectiveness && (
                      <div className="detail-item">
                        <span className="label">効果レベル:</span>
                        <span className="value">{'★'.repeat(Math.round(recommendation.fungicide.effectiveness))}</span>
                      </div>
                    )}
                    
                    {recommendation.fungicide?.next_application_date && (
                      <div className="detail-item">
                        <span className="label">次回推奨日:</span>
                        <span className="value">{new Date(recommendation.fungicide.next_application_date).toLocaleDateString('ja-JP')}</span>
                      </div>
                    )}
                  </div>

                  {recommendation.fungicide?.target_pests && recommendation.fungicide.target_pests.length > 0 && (
                    <div className="target-pests">
                      <span className="label">対象病気:</span>
                      <div className="pests-list">
                        {recommendation.fungicide.target_pests.slice(0, 3).map((disease, idx) => (
                          <span key={idx} className="pest-tag">{disease}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendation.fungicide?.warning && (
                    <div className="warning-message">
                      <span className="warning-icon">⚠️</span>
                      <span className="warning-text">{recommendation.fungicide.warning}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="pesticide-recommendations error">
              <div className="summary-card recommendation-card error">
                <h4>殺虫剤推奨</h4>
                <span className="error-text">推奨情報を取得できませんでした</span>
              </div>
              <div className="summary-card recommendation-card error">
                <h4>殺菌剤推奨</h4>
                <span className="error-text">推奨情報を取得できませんでした</span>
              </div>
            </div>
          )}
          
          {/* 全般情報 */}
          {/* {recommendation?.general_info && (
            <div className="general-info">
              <div className="season-info">
                <span className="season-advice">{recommendation.general_info.season_advice}</span>
                {recommendation.general_info.days_since_last !== undefined && (
                  <span className="days-since-last">前回散布から{recommendation.general_info.days_since_last}日経過</span>
                )}
              </div>
            </div>
          )} */}
        </div>
      </div>
    );
  };

  // 薬剤量を自動計算する関数
  const calculatePesticideAmount = (pesticideName, waterAmount, dilutionRatio) => {
    if (!pesticideName || !waterAmount || !dilutionRatio) {
      return '';
    }

    try {
      const waterAmountMl = parseFloat(waterAmount);
      const dilutionFactor = parseFloat(dilutionRatio);

      if (isNaN(waterAmountMl) || isNaN(dilutionFactor) || dilutionFactor === 0) {
        return '';
      }

      // 計算: 水の量(ml) ÷ 希釈倍率 = 薬剤量(ml)
      // 例: 500ml の水で 1000倍希釈 → 500 ÷ 1000 = 0.5ml
      const calculatedAmountMl = waterAmountMl / dilutionFactor;
      
      // 単位を適切に調整
      if (calculatedAmountMl < 0.1) {
        // 0.1ml未満の場合はμl表示
        return `${(calculatedAmountMl * 1000).toFixed(1)}μl`;
      } else if (calculatedAmountMl < 1) {
        // 1ml未満の場合は小数点1桁
        return `${calculatedAmountMl.toFixed(1)}ml`;
      } else {
        // 1ml以上の場合は小数点2桁
        return `${calculatedAmountMl.toFixed(2)}ml`;
      }
    } catch (error) {
      console.error('薬剤量計算エラー:', error);
      return '';
    }
  };

  // 盆栽が選択されていない場合
  if (!bonsaiId) {
    return (
      <div className="pesticide-log-container">
        {/* 盆栽一覧に戻るボタンを一番左上に独立配置 */}
        <div className="top-back-button-container">
          <button 
            className="back-button"
            onClick={navigateToBonsaiList}
          >
            ←盆栽一覧に戻る
          </button>
        </div>

        <div className="page-header">
          <h1>農薬記録</h1>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {loading ? (
          <div className="loading">読み込み中...</div>
        ) : logs.length > 0 ? (
          <div className="logs-container">
            <h2>全ての農薬記録履歴</h2>
            <table className="logs-table enhanced">
              <thead>
                <tr>
                  <th>盆栽名</th>
                  <th>使用日</th>
                  <th>農薬名</th>
                  <th>使用量</th>
                  <th>メモ</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td>{log.bonsai_name}</td>
                    <td>{new Date(log.usage_date).toLocaleDateString('ja-JP')}</td>
                    <td>{log.pesticide_name}</td>
                    <td>{log.dosage || '-'}</td>
                    <td>{log.notes || '-'}</td>
                    <td>
                      <button 
                        className="delete-button"
                        onClick={() => handleDeleteLog(log.id)}
                        aria-label="削除"
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <p>まだ農薬記録がありません。盆栽一覧から盆栽を選択して記録を追加してください。</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pesticide-log-container">
      {/* 盆栽一覧に戻るボタンを一番左上に独立配置 */}
      <div className="top-back-button-container">
        <button 
          className="back-button"
          onClick={navigateToBonsaiList}
        >
          ←盆栽一覧に戻る
        </button>
      </div>

      <div className="page-header">
        <h1>
          農薬記録
          {bonsaiInfo && (
            <span className="bonsai-info">
              <span className="bonsai-name"> - {bonsaiInfo.name}</span>
              {bonsaiInfo.species && <span className="bonsai-species"> ({bonsaiInfo.species})</span>}
            </span>
          )}
        </h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {renderRecommendationSummary()}

      {/* 農薬記録を追加ボタンを推奨情報の下、月次サマリーの上に配置 */}
      <div className="add-button-container">
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '閉じる' : '農薬記録を追加'}
        </button>
      </div>

      {/* フォームをボタンの下に表示 */}
      {showAddForm && renderDualPesticideForm()}

      {renderMonthlyRisks()}

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : logs.length > 0 ? (
        <div className="logs-container">
          <h2>農薬使用履歴</h2>
          <table className="logs-table enhanced">
            <thead>
              <tr>
                <th>使用日</th>
                <th>農薬名</th>
                <th>使用量</th>
                <th>水量</th>
                <th>希釈比</th>
                <th>メモ</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>{new Date(log.date).toLocaleDateString('ja-JP')}</td>
                  <td className="pesticide-name">{log.pesticide_name}</td>
                  <td>{log.dosage || log.amount || '-'}</td>
                  <td>{log.water_amount || '-'}</td>
                  <td>{log.dilution_ratio || '-'}</td>
                  <td className="notes">{log.notes || '-'}</td>
                  <td>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteLog(log.id)}
                      aria-label="削除"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>まだ農薬記録がありません。記録を追加してください。</p>
        </div>
      )}
    </div>
  );
};

export default PesticideLog; 