import React from 'react';
import { CloudinaryContext } from 'cloudinary-react';

function App() {
  return (
    <CloudinaryContext cloudName="dayn5vifn">
      {/* Your app components */}
      <h1>Welcome to Cloudinary Integration</h1>
    </CloudinaryContext>
  );
}

export default App;