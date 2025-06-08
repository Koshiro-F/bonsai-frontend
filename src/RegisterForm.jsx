import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  
  // APIのベースURL
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:6000'  // 開発環境
    : 'https://bonsai-backend.modur4.com';  // 本番環境

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // 簡易的なバリデーション
    if (username.length < 3) {
      setMessage("ユーザー名は3文字以上必要です");
      return;
    }
    if (password.length < 6) {
      setMessage("パスワードは6文字以上必要です");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/register`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest" 
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
        mode: 'cors'
      });

      const data = await response.json();
      if (data.success) {
        // ユーザー名とユーザーIDをセッションストレージに保存
        sessionStorage.setItem('username', username);
        sessionStorage.setItem('userId', data.id.toString());
        navigate('/dashboard');
      } else {
        setMessage(data.message || "登録に失敗しました");
      }
    } catch (error) {
      console.error("登録エラー:", error);
      setMessage("サーバーエラーが発生しました");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>アカウント登録</h1>
        
        {message && (
          <div className="error-message">{message}</div>
        )}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button">登録する</button>
          
          <div className="form-footer">
            <p>すでにアカウントをお持ちの方は <Link to="/">ログイン</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm; 