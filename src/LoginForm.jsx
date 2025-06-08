import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // APIのベースURL
  // 環境に応じて適切なURLに設定
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:6000'  // 開発環境
    : 'https://bonsai-backend.modur4.com';  // 本番環境

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("ログイン中");
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/login`, {
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
        sessionStorage.setItem('username', data.user);
        sessionStorage.setItem('userId', data.id.toString());
        // ダッシュボードへ遷移
        navigate('/dashboard');
      } else {
        setMessage("ログインに失敗しました");
      }
    } catch (error) {
      console.error("ログインエラー:", error);
      setMessage("サーバーエラーが発生しました");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>ログイン</h1>
        
        {message && (
          <div className="error-message">{message}</div>
        )}
        
        <form onSubmit={handleLogin}>
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
          
          <button type="submit" className="login-button">ログイン</button>
          
          <div className="form-footer">
            <p>アカウントをお持ちでない方は <Link to="/register">新規登録</Link></p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
