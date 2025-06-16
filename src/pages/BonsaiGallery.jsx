import { useState, useEffect } from 'react';
import './BonsaiGallery.css';
import ImageUploader from './ImageUploader';

const BonsaiGallery = ({ apiBaseUrl, userId, bonsaiId }) => {
  const [bonsaiInfo, setBonsaiInfo] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  // 盆栽の画像一覧を取得
  const fetchBonsaiImages = async () => {
    if (!bonsaiId || !userId) {
      setError('盆栽IDまたはユーザーIDが指定されていません');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${apiBaseUrl}/api/bonsai/${bonsaiId}/images?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '画像データの取得に失敗しました');
      }

      const data = await response.json();
      setBonsaiInfo({ id: data.bonsai_id, name: data.bonsai_name });
      setImages(data.images);
      setError(null);
    } catch (err) {
      console.error('画像データ取得エラー:', err);
      setError(err.message || '画像データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBonsaiImages();
  }, [apiBaseUrl, userId, bonsaiId]);

  // 画像アップロード成功時のコールバック
  const handleImageUploadSuccess = (result) => {
    setShowImageUploader(false);
    // 画像一覧を再取得
    fetchBonsaiImages();
  };

  // 画像削除の確認
  const handleDeleteImageClick = (image) => {
    setImageToDelete(image);
    setShowDeleteConfirm(true);
  };

  // 画像削除の実行
  const handleDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/bonsai/image/${imageToDelete.id}?user_id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '画像の削除に失敗しました');
      }

      // 削除成功
      setShowDeleteConfirm(false);
      setImageToDelete(null);
      // 画像一覧を再取得
      fetchBonsaiImages();
    } catch (err) {
      console.error('画像削除エラー:', err);
      setError(err.message || '画像の削除中にエラーが発生しました。');
    }
  };

  // 画像をフルサイズで表示
  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  // 盆栽一覧に戻る
  const goBackToBonsaiList = () => {
    window.setCurrentPage('bonsai-list');
  };

  // 日付のフォーマット
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="bonsai-gallery-container">
        <div className="page-header">
          <button className="back-button" onClick={goBackToBonsaiList}>
            ← 盆栽一覧に戻る
          </button>
        </div>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="bonsai-gallery-container">
      <div className="page-header">
        <button className="back-button" onClick={goBackToBonsaiList}>
          ← 盆栽一覧に戻る
        </button>
        <h1>{bonsaiInfo?.name} の画像ギャラリー</h1>
      </div>
      <div className="bonsai-add-button">
        <button 
          className="add-button"
          onClick={() => setShowImageUploader(true)}
        >
          写真を追加
        </button>
      </div>

      {/* 画像アップローダー */}
      {showImageUploader && (
        <ImageUploader 
          bonsaiId={bonsaiId}
          userId={userId}
          apiBaseUrl={apiBaseUrl}
          onSuccess={handleImageUploadSuccess}
          onCancel={() => setShowImageUploader(false)}
        />
      )}

      {/* 削除確認ダイアログ */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="delete-confirm-modal">
            <h3>画像を削除しますか？</h3>
            <p>この操作は取り消せません。</p>
            <div className="modal-actions">
              <button 
                className="delete-button"
                onClick={handleDeleteImage}
              >
                削除
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setImageToDelete(null);
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 画像詳細モーダル */}
      {selectedImage && (
        <div className="modal-overlay" onClick={() => setSelectedImage(null)}>
          <div className="image-detail-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-button"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            <img 
              src={`${apiBaseUrl}/api/bonsai/image/${selectedImage.id}?user_id=${userId}`}
              alt={`${bonsaiInfo?.name}の写真`}
              className="full-size-image"
            />
            <div className="image-info">
              <p>撮影日時: {formatDate(selectedImage.created_at)}</p>
              <p>ファイル名: {selectedImage.original_filename}</p>
            </div>
          </div>
        </div>
      )}

      {/* 画像グリッド */}
      {images.length === 0 ? (
        <div className="empty-state">
          <p>まだ写真が登録されていません。「写真を追加」ボタンから写真を追加してください。</p>
        </div>
      ) : (
        <div className="image-gallery">
          {images.map(image => (
            <div key={image.id} className="gallery-image-card">
              <div className="gallery-image-container">
                <img 
                  src={`${apiBaseUrl}/api/bonsai/image/${image.id}?user_id=${userId}`}
                  alt={`${bonsaiInfo?.name}の写真`}
                  className="gallery-image"
                  onClick={() => handleImageClick(image)}
                />
                <button 
                  className="delete-image-button"
                  onClick={() => handleDeleteImageClick(image)}
                  title="画像を削除"
                >
                  ×
                </button>
              </div>
              <div className="image-date">
                {formatDate(image.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BonsaiGallery; 