import axios from 'axios';
import { useState, useEffect, useRef } from "react";
import { Modal } from 'bootstrap';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

// 預設的 Modal 狀態，用於新增或編輯時的表單初始化
const defaultModalState = {
  imageUrl: "",
  title: "",
  category: "",
  unit: "",
  origin_price: "",
  price: "",
  description: "",
  content: "",
  is_enabled: 0,
  imagesUrl: [""]
};

function App() {
  // 驗證使用者身份的狀態
  const [isAuth, setIsAuth] = useState(false);
  // 產品列表的狀態
  const [products, setProducts] = useState([]);
  // 使用者帳號資訊的狀態
  const [account, setAccount] = useState(
    {
      username: "example@test.com",
      password: "example"
    });

  // 處理登入表單輸入變更
  const handleInputChange = (e) => {
    const { value, name } = e.target;

    setAccount({
      ...account,
      [name]: value
    });
  };

  // 從後端取得產品資料
  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products`
      );
      setProducts(res.data.products); // 更新產品列表

      console.log("取得的產品資料：", res.data.products);

    } catch (error) {
      alert("取得產品失敗");
    }
  };

  // 處理使用者登入
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);

      console.log("登入 API 回應：", res.data);

      // 儲存取得的 token 並設定過期時間
      const { token, expired } = res.data;
      
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;

      axios.defaults.headers.common["Authorization"] = token;

      getProducts(); // 成功登入後取得產品資料

      setIsAuth(true); // 更新登入狀態
    } catch (error) {
      alert("登入失敗");
    }
  };

  // 檢查使用者是否已登入
  const checkUserLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);

      getProducts();

      setIsAuth(true);
    } catch (error) {
      console.error(error)
    }
  };

  // 在登入頁面渲染時取出 token 並觸發驗證登入 API
  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1",
    );

    // 設定 axios 的預設 token
    axios.defaults.headers.common['Authorization'] = token;

    checkUserLogin();
  }, [])

  // Modal 的參考 (ref) 用於操作 DOM 元素
  const productModalRef = useRef(null);
  const delProductModalRef = useRef(null);
  // Modal 模式狀態 (新增或編輯)
  const [modalMode, setModalMode] = useState(null);

  // 初始化 Bootstrap 的 Modal
  useEffect(() => {
    new Modal(productModalRef.current, {
      backdrop: false
    });

    new Modal(delProductModalRef.current, {
      backdrop: false
    });
    
  }, [])

  // 開啟產品的新增或編輯 Modal
  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);

    switch (mode) { 
      // switch 是 JavaScript 中的一種條件語句，用於根據變數的值執行不同的邏輯。
      // 它的作用類似於多個 if-else，但在多條件情況下更易於閱讀。
      case 'create':
        setTempProduct(defaultModalState); // 新增時重置狀態
        break;

        case 'edit':
        setTempProduct(product); // 編輯時填入產品資料
        break;
    
      default:
        break;
    }
    
    const modalInstance = Modal.getInstance(productModalRef.current);
    modalInstance.show(); // 顯示 Modal
  }

  // 關閉產品 Modal
  const handleCloseProductModal = () => {
    const modalInstance = Modal.getInstance(productModalRef.current);

    modalInstance.hide(); // 隱藏 Modal
  };

  // 開啟刪除產品的 Modal
  const handleOpenDelProductModal = (product) => {
    setTempProduct(product); // 設定當前要刪除的產品

    const modalInstance = Modal.getInstance(delProductModalRef.current);
    
    modalInstance.show();
  }

  // 關閉刪除產品 Modal
  const handleCloseDelProductModal = () => {
    const modalInstance = Modal.getInstance(delProductModalRef.current);
    
    modalInstance.hide();
  }

  // 暫存產品的狀態 (新增或編輯用)
  const [tempProduct, setTempProduct] = useState(defaultModalState);

  // 處理 Modal 中的表單輸入變更
  const handleModalInputChange = (e) => {
    const { value, name, checked, type } = e.target;

    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value
    })
  } 

  // 處理圖片輸入框的變更
  const handleImageChange = (e, index) => {
    const { value } = e.target;

    // 複製當前的 imagesUrl 陣列
    const newImages = [...tempProduct.imagesUrl];

    // 更新指定索引的圖片網址
    newImages[index] = value;

    // 更新 tempProduct 狀態
    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages // 更新圖片網址陣列
    })
  }

  // 新增一個空白的圖片輸入框
  const handleAddImage = () => {
    // 如果有空白欄位就不要新增
    if (tempProduct.imagesUrl.some((url) => url === '')) {
      return;
    }

    // 在 imagesUrl 陣列末尾新增一個空字串
    const newImages = [...tempProduct.imagesUrl, ''];

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 移除最後一個圖片輸入框
  const handleRemoveImage = () => {
    const newImages = [...tempProduct.imagesUrl];

    // pop 刪除陣列中的最後一個元素
    newImages.pop();

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages
    })
  }

  // 新增產品的 API 請求
  const createProduct = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product/`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price), // 確保價格為數字
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0 // 將布林值轉換為 0 或 1
        }
      })
    } catch (error) {
      throw error; // 讓 handleUpdateProduct() 捕捉錯誤並顯示訊息
    }
  }

  // 編輯產品的 API 請求
  const updateProduct = async () => {
    try {
      await axios.put(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      })
    } catch (error) {
      alert('編輯產品失敗');
    }
  }
  
  // 刪除產品的 API 請求
  const deleteProduct = async () => {
    try {
      await axios.delete(`${BASE_URL}/v2/api/${API_PATH}/admin/product/${tempProduct.id}`, {
        data: {
          ...tempProduct,
          origin_price: Number(tempProduct.origin_price),
          price: Number(tempProduct.price),
          is_enabled: tempProduct.is_enabled ? 1 : 0
        }
      })
    } catch (error) {
      alert('刪除產品失敗');
    }
  }

  // 根據模式執行新增或編輯產品的操作
  const handleUpdateProduct = async () => {
    const apiCall = modalMode === 'create' ? createProduct : updateProduct; // 判斷使用的 API

    try {
      await apiCall(); // 執行 API 請求

      getProducts();

      handleCloseProductModal(); // 關閉 Modal
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "更新產品失敗");
    }
  }

  // 刪除產品並更新列表
  const handleDeleteProdct = async () => {
    try {
      await deleteProduct(); // 執行刪除請求

      getProducts();

      handleCloseDelProductModal(); // 關閉刪除確認 Modal
    } catch (error) {
      alert('刪除產品失敗');
    }
  };

  return (
    <>

    {isAuth ? (<div className="container py-5">
      <div className="row">
        <div className="col">
          <div className="d-flex justify-content-between">
            <h2>產品列表</h2>
            <button onClick={() => handleOpenProductModal('create')} type="button" className="btn btn-primary">建立新的產品</button>
          </div>
          
          <table className="table">
            <thead>
              <tr>
                <th scope="col">產品名稱</th>
                <th scope="col">原價</th>
                <th scope="col">售價</th>
                <th scope="col">是否啟用</th>
                <th scope="col">查看細節</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <th scope="row">{product.title}</th>
                  <td>{product.origin_price}</td>
                  <td>{product.price}</td>
                  <td>{product.is_enabled ? (<span className="text-success">啟用</span>) : <span>未啟用</span>}</td>
                  <td>
                  <div className="btn-group">
                    <button onClick={() => handleOpenProductModal('edit', product)} type="button" className="btn btn-outline-primary btn-sm">編輯</button>
                    <button onClick={() => handleOpenDelProductModal(product)} type="button" className="btn btn-outline-danger btn-sm">刪除</button>
                  </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>) : (<div className="d-flex flex-column justify-content-center align-items-center vh-100">
    <h1 className="mb-5">請先登入</h1>
    <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
      <div className="form-floating mb-3">
        <input name="username" value={account.username} onChange={handleInputChange}  type="email" className="form-control" id="username" placeholder="name@example.com" />
        <label htmlFor="username">Email address</label>
      </div>
      <div className="form-floating">
        <input name="password" value={account.password} onChange={handleInputChange} type="password" className="form-control" id="password" placeholder="Password" />
        <label htmlFor="password">Password</label>
      </div>
      <button className="btn btn-primary">登入</button>
    </form>
    <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
    </div>)}

    <div ref={productModalRef} id="productModal" className="modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
    <div className="modal-dialog modal-dialog-centered modal-xl">
      <div className="modal-content border-0 shadow">
        <div className="modal-header border-bottom">
          <h5 className="modal-title fs-4">{modalMode === 'create' ? '新增產品' : '編輯產品'}</h5>
          <button onClick={handleCloseProductModal} type="button" className="btn-close" aria-label="Close"></button>
        </div>

        <div className="modal-body p-4">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="mb-4">
                <label htmlFor="primary-image" className="form-label">
                  主圖
                </label>
                <div className="input-group">
                  <input
                    value={tempProduct.imageUrl}
                    onChange={handleModalInputChange}
                    name="imageUrl"
                    type="text"
                    id="primary-image"
                    className="form-control"
                    placeholder="請輸入圖片連結"
                  />
                </div>
                <img
                  src={tempProduct.imageUrl}
                  alt={tempProduct.title}
                  className="img-fluid"
                />
              </div>

              {/* 副圖 */}
              <div className="border border-2 border-dashed rounded-3 p-3">
                {tempProduct.imagesUrl?.map((image, index) => (
                  <div key={index} className="mb-2">
                    <label
                      htmlFor={`imagesUrl-${index + 1}`}
                      className="form-label"
                    >
                      副圖 {index + 1}
                    </label>
                    <input 
                      value={image}
                      onChange={(e) => handleImageChange(e, index)}
                      id={`imagesUrl-${index + 1}`}
                      type="text"
                      placeholder={`圖片網址 ${index + 1}`}
                      className="form-control mb-2"
                    />
                    {image && (
                      <img
                        src={image}
                        alt={`副圖 ${index + 1}`}
                        className="img-fluid mb-2"
                      />
                    )}
                  </div>
                ))}

              <div className="btn-group w-100">
                {tempProduct.imagesUrl.length < 5 && 
                  tempProduct.imagesUrl[tempProduct.imagesUrl.length - 1] !== '' && (
                  <button onClick={handleAddImage} className="btn btn-outline-primary btn-sm w-100">新增圖片</button>
                  )}
                
                {tempProduct.imagesUrl.length > 1 && (
                  <button onClick={handleRemoveImage}className="btn btn-outline-danger btn-sm w-100">取消圖片</button>
                  )}
                </div>

              </div>
            </div>

            <div className="col-md-8">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  標題
                </label>
                <input
                  value={tempProduct.title}
                  onChange={handleModalInputChange}
                  name="title"
                  id="title"
                  type="text"
                  className="form-control"
                  placeholder="請輸入標題"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="category" className="form-label">
                  分類
                </label>
                <input
                  value={tempProduct.category}
                  onChange={handleModalInputChange}
                  name="category"
                  id="category"
                  type="text"
                  className="form-control"
                  placeholder="請輸入分類"
                />
              </div>

              <div className="mb-3">
                <label htmlFor="unit" className="form-label">
                  單位
                </label>
                <input
                  value={tempProduct.unit}
                  onChange={handleModalInputChange}
                  name="unit"
                  id="unit"
                  type="text"
                  className="form-control"
                  placeholder="請輸入單位"
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label htmlFor="origin_price" className="form-label">
                    原價
                  </label>
                  <input
                    value={tempProduct.origin_price}
                    onChange={handleModalInputChange}
                    name="origin_price"
                    id="origin_price"
                    type="number"
                    className="form-control"
                    placeholder="請輸入原價"
                    min="0"
                  />
                </div>
                <div className="col-6">
                  <label htmlFor="price" className="form-label">
                    售價
                  </label>
                  <input
                    value={tempProduct.price}
                    onChange={handleModalInputChange}
                    name="price"
                    id="price"
                    type="number"
                    className="form-control"
                    placeholder="請輸入售價"
                    min="0"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  產品描述
                </label>
                <textarea
                  value={tempProduct.description}
                  onChange={handleModalInputChange}
                  name="description"
                  id="description"
                  className="form-control"
                  rows={4}
                  placeholder="請輸入產品描述"
                ></textarea>
              </div>

              <div className="mb-3">
                <label htmlFor="content" className="form-label">
                  說明內容
                </label>
                <textarea
                  value={tempProduct.content}
                  onChange={handleModalInputChange}
                  name="content"
                  id="content"
                  className="form-control"
                  rows={4}
                  placeholder="請輸入說明內容"
                ></textarea>
              </div>

              <div className="form-check">
                <input
                  checked={tempProduct.is_enabled}
                  onChange={handleModalInputChange}
                  name="is_enabled"
                  type="checkbox"
                  className="form-check-input"
                  id="isEnabled"
                />
                <label className="form-check-label" htmlFor="isEnabled">
                  是否啟用
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer border-top bg-light">
          <button onClick={handleCloseProductModal} type="button" className="btn btn-secondary">
            取消
          </button>
          <button onClick={handleUpdateProduct} type="button" className="btn btn-primary">
            確認
          </button>
        </div>
      </div>
    </div>
    </div>

    <div
      ref={delProductModalRef}
      className="modal fade"
      id="delProductModal"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5">刪除產品</h1>
            <button onClick={handleCloseDelProductModal}
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>
          <div className="modal-body">
            你是否要刪除 
            <span className="text-danger fw-bold">{tempProduct.title}</span>
          </div>
          <div className="modal-footer">
            <button onClick={handleCloseDelProductModal}
              type="button"
              className="btn btn-secondary"
            >
              取消
            </button>
            <button onClick={handleDeleteProdct} type="button" className="btn btn-danger">
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
  )
}

export default App;