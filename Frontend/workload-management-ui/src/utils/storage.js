/**
 * Local Storage Utility Functions
 */

const storage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error getting item from localStorage:", error);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting item in localStorage:", error);
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing item from localStorage:", error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },

  hasItem: (key) => {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      console.error("Error checking item in localStorage:", error);
      return false;
    }
  },
};

export const setToken = (token) => {
  try {
    localStorage.setItem("token", token);
  } catch (error) {
    console.error("Error setting token in localStorage:", error);
  }
};

export const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch (error) {
    console.error("Error getting token from localStorage:", error);
    return null;
  }
};

export const removeToken = () => {
  try {
    localStorage.removeItem("token");
  } catch (error) {
    console.error("Error removing token from localStorage:", error);
  }
};

export const setUser = (user) => {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.error("Error setting user in localStorage:", error);
  }
};

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("Error getting user from localStorage:", error);
    return null;
  }
};

export const removeUser = () => {
  try {
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error removing user from localStorage:", error);
  }
};

export const clearAuthStorage = () => {
  removeToken();
  removeUser();
};

export default storage;