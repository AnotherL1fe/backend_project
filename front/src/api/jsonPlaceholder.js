//Библиотека для http-запросов
import axios from 'axios';

import { BASEURL } from '.';

const jsonPlaceholderAPI = {
  async fetchUsers() {
    try {
      const response = await axios.get(`${BASEURL}/users`);
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    } 
  },

  async fetchUserPosts(userId) {
    try {
      const response = await axios.get(`${BASEURL}/users/${userId}/posts`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching posts for user ${userId}:`, error);
      throw error;
    }
  },

  async fetchUserById(userId) {
    try {
      const response = await axios.get(`${BASEURL}/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  }
};

export default jsonPlaceholderAPI;