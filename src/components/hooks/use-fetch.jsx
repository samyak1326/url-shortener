import {useState} from "react";

const useFetch = (cb, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null);

  const fn = async (...args) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching data...");
      const response = await cb(options, ...args);
      console.log("Response:", response); // Debugging info
      setData(response);
      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error); // Error logging
      setError(error);
    } finally {
      setLoading(false);
      console.log("Loading finished"); // Debugging info
    }
  };

  return {data, loading, error, fn};
};

export default useFetch;
