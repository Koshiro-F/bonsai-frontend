import { useState } from 'react';
import './Pages.css';

const ImageUploader = ({ bonsaiId, userId, apiBaseUrl, onSuccess, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // プレビュー表示
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        
        // プレビュー表示
        const reader = new FileReader();
        reader.onload = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setError('画像ファイルのみをアップロードできます');
      }
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }
    
    setUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      const response = await fetch(`${apiBaseUrl}/api/bonsai/${bonsaiId}/image?user_id=${userId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アップロードに失敗しました');
      }
      
      const result = await response.json();
      
      // 成功時にコールバックを呼び出す
      onSuccess(result);
      
    } catch (err) {
      console.error('アップロードエラー:', err);
      setError(err.message || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="image-uploader">
      <h3>盆栽の写真をアップロード</h3>
      
      <div className="upload-area">
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="プレビュー" className="image-preview" />
            <button 
              className="change-image-btn"
              onClick={() => {
                setSelectedFile(null);
                setPreview(null);
              }}
            >
              画像を変更
            </button>
          </div>
        ) : (
          <div 
            className="drop-zone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <p>ここに画像をドラッグ＆ドロップ</p>
            <p>または</p>
            <label className="file-input-label">
              ファイルを選択
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="file-input"
              />
            </label>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="uploader-actions">
        <button
          className="submit-button"
          onClick={handleUpload}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'アップロード中...' : 'アップロード'}
        </button>
        <button
          className="cancel-button"
          onClick={onCancel}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
};

export default ImageUploader; 