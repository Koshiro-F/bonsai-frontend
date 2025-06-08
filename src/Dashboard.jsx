import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './Dashboard.css';

// 盆栽管理用のページコンポーネントをインポート
import BonsaiList from './pages/BonsaiList';
import PesticideLog from './pages/PesticideLog';
import BonsaiGallery from './pages/BonsaiGallery';
import AdminMaster from './pages/AdminMaster';

function Dashboard() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem('username');
  const userId = sessionStorage.getItem('userId');
  // 現在表示中のページを管理するstate
  const [currentPage, setCurrentPage] = useState('bonsai-list');
  // サイドバーの表示状態を管理するstate
  const [sidebarVisible, setSidebarVisible] = useState(true);
  // ユーザー情報を管理するstate
  const [user, setUser] = useState(null);
  // 管理者権限の確認状態
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);
  
  // APIのベースURL
  const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:6000'  // 開発環境
    : 'https://bonsai-backend.modur4.com';  // 本番環境（実際のURLに変更してください）

  // 管理者権限を確認する関数
  const checkAdminStatus = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/is-admin/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsAdmin(data.is_admin);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('管理者権限の確認に失敗しました:', error);
      setIsAdmin(false);
    } finally {
      setAdminCheckComplete(true);
    }
  };

  // ユーザー情報を取得する関数
  const fetchUserInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser({
            id: parseInt(userId),
            username: username,
            role: data.user.role || 'user'
          });
        } else {
          // デフォルトのユーザー情報を設定
          setUser({
            id: parseInt(userId),
            username: username,
            role: 'user'
          });
        }
      }
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      // デフォルトのユーザー情報を設定
      setUser({
        id: parseInt(userId),
        username: username,
        role: 'user'
      });
    }
  };

  // 画面幅に応じてサイドバーの表示/非表示を切り替える
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarVisible(false);
      } else {
        setSidebarVisible(true);
      }
    };
    
    // 初期表示時にも実行
    handleResize();
    
    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', handleResize);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ユーザー情報と管理者権限を取得
  useEffect(() => {
    if (userId) {
      fetchUserInfo();
      checkAdminStatus();
    }
  }, [userId]);

  // 管理者ページにアクセスしようとした時のチェック
  useEffect(() => {
    if (adminCheckComplete && currentPage === 'admin-master' && !isAdmin) {
      // 管理者権限がない場合は盆栽一覧に戻す
      setCurrentPage('bonsai-list');
      alert('管理者権限が必要です');
    }
  }, [adminCheckComplete, isAdmin, currentPage]);

  // グローバルに関数を公開して、子コンポーネントからもページ遷移できるようにする
  useEffect(() => {
    // グローバルに関数を公開
    window.setCurrentPage = setCurrentPage;
    
    // クリーンアップ関数
    return () => {
      delete window.setCurrentPage;
    };
  }, []);

  // ページ読み込み時に、ユーザーが変わっていれば選択中の盆栽IDをリセット
  useEffect(() => {
    // 前回のユーザーIDを確認
    const lastUserId = window.lastUserId;
    
    // ユーザーIDが変わっていたら盆栽選択をリセット
    if (lastUserId && lastUserId !== userId) {
      window.selectedBonsaiId = null;
    }
    
    // 現在のユーザーIDを保存
    window.lastUserId = userId;
  }, [userId]);

  // ユーザー名がなければログイン画面へリダイレクト
  useEffect(() => {
    if (!username || !userId) {
      navigate('/');
    }
  }, [username, userId]);


  const handleLogout = async () => {
    // セッションストレージをクリア
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    
    // グローバル変数もクリア
    window.selectedBonsaiId = null;
    window.lastUserId = null;
    
    // ログイン画面へリダイレクト
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // 管理者ページへの安全な遷移
  const navigateToAdminMaster = () => {
    if (isAdmin) {
      setCurrentPage('admin-master');
    } else {
      alert('管理者権限が必要です');
    }
  };

  

  // 現在のページに応じたコンポーネントを表示
  const renderCurrentPage = () => {
    switch(currentPage) {
      case 'bonsai-list':
        return <BonsaiList apiBaseUrl={API_BASE_URL} userId={userId} />;
      case 'pesticide-log':
        return <PesticideLog apiBaseUrl={API_BASE_URL} userId={userId} />;
      case 'bonsai-gallery':
        return <BonsaiGallery 
          apiBaseUrl={API_BASE_URL} 
          userId={userId} 
          bonsaiId={window.selectedBonsaiId} 
        />;
      case 'admin-master':
        // 管理者権限のダブルチェック
        if (!isAdmin) {
          return (
            <div className="error-message">
              <h2>アクセス拒否</h2>
              <p>このページにアクセスするには管理者権限が必要です。</p>
            </div>
          );
        }
        return <AdminMaster apiBaseUrl={API_BASE_URL} userId={userId} />;
      default:
        return <BonsaiList apiBaseUrl={API_BASE_URL} userId={userId} />;
    }
  };

  return (
    <div className="dashboard-container">
      {/* サイドバートグルボタン（モバイル用） */}
      {/* <div className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarVisible ? '←' : '→'}
      </div> */}
      
      {/* サイドナビゲーションバー */}
      <div className={`sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
        <div className="sidebar-header">
          <h2>盆栽管理システム</h2>
          <p className="user-info">
            {username} さん
            {isAdmin && <span className="admin-badge">管理者</span>}
          </p>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li 
              className={currentPage === 'bonsai-list' ? 'active' : ''} 
              onClick={() => setCurrentPage('bonsai-list')}
            >
              盆栽一覧
            </li>
            <li 
              className={currentPage === 'pesticide-log' ? 'active' : ''} 
              onClick={() => setCurrentPage('pesticide-log')}
            >
              農薬記録
            </li>
            {/* 管理者のみにマスタ管理リンクを表示 */}
            {isAdmin && (
              <>
                <li className="menu-divider"></li>
                <li 
                  className={currentPage === 'admin-master' ? 'active admin-menu' : 'admin-menu'} 
                  onClick={navigateToAdminMaster}
                >
                  🛠️ マスタ管理
                </li>
              </>
            )}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">ログアウト</button>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className={`main-content ${sidebarVisible ? '' : 'full-width'}`}>
        {renderCurrentPage()}
      </div>
      
      {/* モバイル用ボトムナビゲーション */}
      <div className="mobile-nav">
        <div 
          className={currentPage === 'bonsai-list' ? 'active' : ''} 
          onClick={() => setCurrentPage('bonsai-list')}
        >
          盆栽一覧
        </div>
        <div 
          className={currentPage === 'pesticide-log' ? 'active' : ''} 
          onClick={() => setCurrentPage('pesticide-log')}
        >
          農薬記録
        </div>
        {/* 管理者のみにモバイル管理メニューを表示 */}
        {isAdmin && (
          <div 
            className={currentPage === 'admin-master' ? 'active admin-mobile' : 'admin-mobile'} 
            onClick={navigateToAdminMaster}
          >
            管理
          </div>
        )}
        <div className="logout-button" onClick={handleLogout}>
          ログアウト
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 