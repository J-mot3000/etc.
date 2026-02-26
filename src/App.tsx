import './App.css';
import Home from './Pages/Home';
// import Header from './Components/Header';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from './Pages/Landing';
import Products from './Pages/Products';
import Cart from './Pages/Cart';
import Admin from './Pages/Admin';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Login from './Pages/Login';
import Checkout from './Pages/Checkout';

function App() {
 

  return (
    <>
     
     
    <AuthProvider>
    <CartProvider>
    <Router>
        <Routes>
          <Route path='/' element={<Landing/>}/>
          <Route path='/home' element={<Home/>}/>
          <Route path='/products' element={<Products/>}/>
          <Route path='/admin' element={<Admin/>}/>
          <Route path='/cart' element={<Cart/>}/>
          <Route path='/checkout' element={<Checkout/>}/>
          <Route path='/login' element={<Login/>}/>
        </Routes>
     </Router>
        </CartProvider>
        </AuthProvider>
     
    </>
  )
}

export default App
