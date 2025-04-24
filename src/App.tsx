import TinyScroll from './components/TinyScrollList';

import './App.css'

function App() {
  const data = Array.from({ length: 100 }, (_, index) => ({
    id: index,
    name: `Item ${index + 1}`,
  }));
  return (
    <>
      <div>
          <TinyScroll
                 data={data}
                 itemHeight={80}
                 visibleCount={5}
                 topBuffer={5}
                 bottomBuffer={5}
                 speed={0.5}
                 autoPlay={true}
                 renderItem={(item) => {
                  return <div style={{height: 80}}>
                    {item.name}
                  </div>
                 }}
          ></TinyScroll>
      </div>
    </>
  )
}

export default App
