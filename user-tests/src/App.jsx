import { Route, Routes, useNavigate } from "react-router-dom";
import './App.css'
import TestWhereButton from "./where-is-the-button";

function Home() {
  const navigate = useNavigate();

  return (
    <>
      <h1>Sup! Here are some user test for my projects 😉</h1>
      <div className="card">
        <button onClick={() => navigate('/where-is-the-button')}>
          Where is the button?
        </button>
      </div>
    </>
  )
}

export default function App() {
    return(
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/where-is-the-button" element={<TestWhereButton />} />
    </Routes>
    )
}
