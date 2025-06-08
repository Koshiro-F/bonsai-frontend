import { useState, useEffect } from 'react';
import './BonsaiList.css';
import ImageUploader from './ImageUploader';

const BonsaiList = ({ apiBaseUrl, userId }) => {
  const [bonsaiList, setBonsaiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [selectedBonsaiId, setSelectedBonsaiId] = useState(null);
  const [speciesList, setSpeciesList] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [newBonsai, setNewBonsai] = useState({
    name: '',
    user_id: userId,
    species_id: '',
    notes: ''
  });

  // ユーザー情報を取得
  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }

      const data = await response.json();
      if (data.success) {
        setUserInfo(data.user);
      }
    } catch (err) {
      console.error('ユーザー情報取得エラー:', err);
      // ユーザー情報取得に失敗してもエラー表示はしない（userIdをフォールバックとして使用）
    }
  };

  // 樹種リストを取得
  const fetchSpeciesList = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai/species`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('樹種データの取得に失敗しました');
      }

      const data = await response.json();
      setSpeciesList(data);
    } catch (err) {
      console.error('樹種データ取得エラー:', err);
      setError('樹種データの取得中にエラーが発生しました。');
    }
  };

  // 盆栽一覧を取得（サーバー側でフィルタリング）
  const fetchBonsaiList = async () => {
    try {
      setLoading(true);
      // 専用エンドポイントを使用するか、クエリパラメータでユーザーIDを送信
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
      // すでにサーバー側でフィルタリングされているため、そのまま設定
      setBonsaiList(data);
      setError(null);
    } catch (err) {
      console.error('盆栽データ取得エラー:', err);
      setError('盆栽データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時に盆栽一覧と樹種リストを取得
  useEffect(() => {
    fetchBonsaiList();
    fetchSpeciesList();
    fetchUserInfo();
  }, [apiBaseUrl, userId]);

  // ユーザーIDが変更されたらnewBonsaiのuser_idを更新
  useEffect(() => {
    setNewBonsai(prev => ({
      ...prev,
      user_id: userId
    }));
    
    // ユーザー情報を再取得
    fetchUserInfo();
    
    // ユーザーが変わったときに盆栽IDをチェック
    const checkBonsaiId = async () => {
      const storedBonsaiId = window.selectedBonsaiId;
      if (storedBonsaiId) {
        try {
          const response = await fetch(`${apiBaseUrl}/api/bonsai/${storedBonsaiId}?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            // このユーザーには権限がないため、選択をクリア
            window.selectedBonsaiId = null;
          }
        } catch (err) {
          console.error('盆栽ID検証エラー:', err);
          window.selectedBonsaiId = null;
        }
      }
    };
    
    checkBonsaiId();
  }, [userId, apiBaseUrl]);

  // 入力フォームの変更ハンドラ
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBonsai({
      ...newBonsai,
      [name]: value
    });
  };

  // 盆栽追加ハンドラ
  const handleAddBonsai = async (e) => {
    e.preventDefault();
    
    // バリデーション
    if (!newBonsai.name.trim()) {
      setError('盆栽の名前は必須です');
      return;
    }

    if (!newBonsai.species_id) {
      setError('盆栽の種類を選択してください');
      return;
    }

    // ユーザーIDが設定されていることを確認
    const bonsaiToAdd = {
      ...newBonsai,
      user_id: userId,
      species_id: parseInt(newBonsai.species_id)
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bonsaiToAdd)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '盆栽の追加に失敗しました');
      }

      const result = await response.json();
      console.log('追加された盆栽ID:', result.id);

      // フォームをリセット
      setNewBonsai({
        name: '',
        user_id: userId,
        species_id: '',
        notes: ''
      });
      setShowAddForm(false);
      
      // 盆栽一覧を再取得
      fetchBonsaiList();
      
    } catch (err) {
      console.error('盆栽追加エラー:', err);
      setError(err.message || '盆栽の追加中にエラーが発生しました。');
    }
  };

  // 農薬記録ページへの遷移
  const navigateToPesticideLogs = (bonsaiId) => {
    // グローバル変数に盆栽IDと現在のユーザーIDを保存
    window.selectedBonsaiId = bonsaiId;
    window.selectedBonsaiUserId = userId;
    window.setCurrentPage('pesticide-log');
  };

  // 画像ギャラリーページへの遷移
  const navigateToGallery = (bonsaiId) => {
    // グローバル変数に盆栽IDと現在のユーザーIDを保存
    window.selectedBonsaiId = bonsaiId;
    window.selectedBonsaiUserId = userId;
    window.setCurrentPage('bonsai-gallery');
  };

  // 画像アップロード用の関数
  const handleImageUploadClick = (bonsaiId) => {
    setSelectedBonsaiId(bonsaiId);
    setShowImageUploader(true);
  };

  // 画像アップロード成功時のコールバック
  const handleImageUploadSuccess = (result) => {
    setShowImageUploader(false);
    // 盆栽一覧を再取得して最新の画像情報を反映
    fetchBonsaiList();
  };

  // 盆栽削除ハンドラ
  const handleDeleteBonsai = async (bonsaiId, bonsaiName) => {
    // 削除確認ダイアログ
    const isConfirmed = window.confirm(
      `"${bonsaiName}" を削除しますか？\n\nこの操作は取り消せません。関連する画像や農薬記録もすべて削除されます。`
    );
    
    if (!isConfirmed) {
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai/${bonsaiId}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '盆栽の削除に失敗しました');
      }

      const result = await response.json();
      
      // 成功メッセージを表示（オプション）
      alert(result.message || '盆栽を削除しました');
      
      // 盆栽一覧を再取得
      fetchBonsaiList();
      
      // もし削除された盆栽が現在選択されている場合、選択を解除
      if (window.selectedBonsaiId === bonsaiId) {
        window.selectedBonsaiId = null;
        window.selectedBonsaiUserId = null;
      }
      
    } catch (err) {
      console.error('盆栽削除エラー:', err);
      setError(err.message || '盆栽の削除中にエラーが発生しました。');
    }
  };

  // 樹種IDから樹種名を取得する関数
  const getSpeciesNameById = (speciesId) => {
    const species = speciesList.find(s => s.id === speciesId);
    return species ? species.name : '不明';
  };

  return (
    <div className="bonsai-list-container">
      <div className="page-header">
        <h1>こんにちは、{userInfo ? userInfo.username : userId}さん</h1>
      </div>
      <div className="bonsai-list-header">
        <h1>あなたの盆栽一覧</h1>
        <button 
          className="add-button"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '閉じる' : '盆栽を追加'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showAddForm && (
        <div className="add-form-container">
          <h2>新しい盆栽を追加</h2>
          <form onSubmit={handleAddBonsai} className="bonsai-form">
            <div className="form-group">
              <label htmlFor="name">名前 *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={newBonsai.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="species_id">樹種 *</label>
              <select
                id="species_id"
                name="species_id"
                value={newBonsai.species_id}
                onChange={handleInputChange}
                
                required
              >
                <option value="">樹種を選択してください</option>
                {speciesList.map(species => (
                  <option key={species.id} value={species.id}>
                    {species.name} ({species.scientific_name})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">メモ</label>
              <textarea
                id="notes"
                name="notes"
                value={newBonsai.notes}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="submit-button">追加</button>
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
      )}

      {/* 画像アップローダーの表示 */}
      {showImageUploader && (
        <ImageUploader 
          bonsaiId={selectedBonsaiId}
          userId={userId}
          apiBaseUrl={apiBaseUrl}
          onSuccess={handleImageUploadSuccess}
          onCancel={() => setShowImageUploader(false)}
        />
      )}

      {loading ? (
        <div className="loading">読み込み中...</div>
      ) : bonsaiList.length === 0 ? (
        <div className="empty-state">
          <p>まだ盆栽が登録されていません。「盆栽を追加」ボタンから登録してください。</p>
        </div>
      ) : (
        <div className="bonsai-grid">
          {bonsaiList.map(bonsai => (
            <div className="bonsai-card" key={bonsai.id}>
              <div className="bonsai-image">
                {bonsai.has_image ? (
                  <img 
                    src={`${apiBaseUrl}/api/bonsai/image/${bonsai.image_id}?user_id=${userId}`} 
                    alt={bonsai.name} 
                    onClick={() => navigateToGallery(bonsai.id)}
                    className="clickable-image"
                    title="クリックして画像ギャラリーを見る"
                  />
                ) : (
                  <button 
                    className="image-upload-btn"
                    onClick={() => handleImageUploadClick(bonsai.id)}
                  >
                    写真を追加
                  </button>
                )}
              </div>
              <h2>{bonsai.name}</h2>
              {bonsai.species && <div className="species">{bonsai.species}</div>}
              <div className="notes">{bonsai.notes}</div>
              <div className="card-actions">
                <button 
                  className="pesticide-button"
                  onClick={() => navigateToPesticideLogs(bonsai.id)}
                >
                  農薬記録を見る
                </button>
                <div className="button-row-bonsai-card">
                  {bonsai.has_image && (
                    <button 
                      className="image-upload-button"
                      onClick={() => handleImageUploadClick(bonsai.id)}
                      style={{ flex: 1 }}
                    >
                      写真を変更
                    </button>
                  )}
                  <button 
                    className="delete-button"
                    onClick={() => handleDeleteBonsai(bonsai.id, bonsai.name)}
                    style={{ flex: bonsai.has_image ? 1 : 'auto' }}
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BonsaiList; 