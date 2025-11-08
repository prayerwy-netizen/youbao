/**
 * Supabase 云数据库配置文件 - 示例模板
 *
 * 使用说明：
 * 1. 复制此文件并重命名为 supabase-config.js
 * 2. 将下面的 YOUR_SUPABASE_PROJECT_URL 和 YOUR_SUPABASE_ANON_KEY 替换为你的真实值
 * 3. supabase-config.js 文件已被 .gitignore 忽略，不会上传到 Git
 */

// ⚠️ 重要：请替换为你自己的 Supabase 项目信息
// 获取方式：Supabase 项目 → Settings → API
const SUPABASE_URL = 'https://xxxxx.supabase.co'  // 例如: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = '以 eyJhbGci 开头的长字符串'  // 以 eyJhbGci 开头的长字符串

// 检查是否已配置 Supabase
const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
                             SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

// 初始化 Supabase 客户端（如果已配置）
let supabaseClient = null;
if (isSupabaseConfigured && typeof window.supabase !== 'undefined') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 客户端初始化成功');
  } catch (error) {
    console.error('❌ Supabase 客户端初始化失败:', error);
  }
}

/**
 * Supabase 数据同步管理器
 * 负责本地 LocalStorage 和云端数据库之间的双向同步
 */
class SupabaseSync {
  constructor() {
    this.enabled = isSupabaseConfigured && supabaseClient !== null;
    if (this.enabled) {
      console.log('🌐 云同步已启用');
      this.init();
    } else {
      console.log('📱 仅使用本地存储模式');
    }
  }

  /**
   * 初始化：从云端同步数据到本地
   */
  async init() {
    if (!this.enabled) return;

    try {
      await this.syncFromCloud();
      console.log('✅ 数据已从云端同步到本地');
    } catch (error) {
      console.error('❌ 云端同步失败，将使用本地数据:', error);
    }
  }

  /**
   * 从云端拉取所有数据到本地
   */
  async syncFromCloud() {
    if (!this.enabled) return;

    try {
      // 同步任务
      const { data: tasks, error: tasksError } = await supabaseClient
        .from('tasks')
        .select('*')
        .order('id', { ascending: true });

      if (tasksError) throw tasksError;
      if (tasks && tasks.length > 0) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        console.log(`✅ 同步 ${tasks.length} 个任务`);
      }

      // 同步礼物
      const { data: gifts, error: giftsError } = await supabaseClient
        .from('gifts')
        .select('*')
        .order('id', { ascending: true });

      if (giftsError) throw giftsError;
      if (gifts) {
        localStorage.setItem('gifts', JSON.stringify(gifts));
        console.log(`✅ 同步 ${gifts.length} 个礼物`);
      }

      // 同步记录
      const { data: records, error: recordsError } = await supabaseClient
        .from('records')
        .select('*')
        .order('date', { ascending: false });

      if (recordsError) throw recordsError;
      if (records) {
        localStorage.setItem('records', JSON.stringify(records));
        console.log(`✅ 同步 ${records.length} 条记录`);
      }

      // 同步兑换申请
      const { data: requests, error: requestsError } = await supabaseClient
        .from('requests')
        .select('*')
        .order('date', { ascending: false });

      if (requestsError) throw requestsError;
      if (requests) {
        localStorage.setItem('requests', JSON.stringify(requests));
        console.log(`✅ 同步 ${requests.length} 个兑换申请`);
      }

      // 同步设置
      const { data: settings, error: settingsError } = await supabaseClient
        .from('settings')
        .select('*');

      if (settingsError) throw settingsError;
      if (settings) {
        const settingsObj = {};
        settings.forEach(item => {
          settingsObj[item.key] = item.value;
        });
        localStorage.setItem('settings', JSON.stringify(settingsObj));
        console.log(`✅ 同步 ${settings.length} 项设置`);
      }
    } catch (error) {
      console.error('❌ 从云端同步数据失败:', error);
      throw error;
    }
  }

  /**
   * 添加任务到云端
   */
  async addTask(task) {
    if (!this.enabled) return task;

    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert([{
          name: task.name,
          unit: task.unit,
          score: task.score,
          type: task.type,
          enabled: task.enabled !== undefined ? task.enabled : true
        }])
        .select();

      if (error) throw error;
      console.log('✅ 任务已同步到云端:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ 同步任务到云端失败:', error);
      return task;
    }
  }

  /**
   * 更新任务到云端
   */
  async updateTask(task) {
    if (!this.enabled || !task.id) return;

    try {
      const { error } = await supabaseClient
        .from('tasks')
        .update({
          name: task.name,
          unit: task.unit,
          score: task.score,
          type: task.type,
          enabled: task.enabled
        })
        .eq('id', task.id);

      if (error) throw error;
      console.log('✅ 任务更新已同步到云端');
    } catch (error) {
      console.error('❌ 同步任务更新失败:', error);
    }
  }

  /**
   * 删除云端任务
   */
  async deleteTask(id) {
    if (!this.enabled || !id) return;

    try {
      const { error } = await supabaseClient
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('✅ 任务删除已同步到云端');
    } catch (error) {
      console.error('❌ 同步任务删除失败:', error);
    }
  }

  /**
   * 添加礼物到云端
   */
  async addGift(gift) {
    if (!this.enabled) return gift;

    try {
      const { data, error } = await supabaseClient
        .from('gifts')
        .insert([{
          name: gift.name,
          image: gift.image || null,
          score: gift.score,
          enabled: gift.enabled !== undefined ? gift.enabled : true
        }])
        .select();

      if (error) throw error;
      console.log('✅ 礼物已同步到云端:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ 同步礼物到云端失败:', error);
      return gift;
    }
  }

  /**
   * 更新礼物到云端
   */
  async updateGift(gift) {
    if (!this.enabled || !gift.id) return;

    try {
      const { error } = await supabaseClient
        .from('gifts')
        .update({
          name: gift.name,
          image: gift.image,
          score: gift.score,
          enabled: gift.enabled
        })
        .eq('id', gift.id);

      if (error) throw error;
      console.log('✅ 礼物更新已同步到云端');
    } catch (error) {
      console.error('❌ 同步礼物更新失败:', error);
    }
  }

  /**
   * 删除云端礼物
   */
  async deleteGift(id) {
    if (!this.enabled || !id) return;

    try {
      const { error } = await supabaseClient
        .from('gifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      console.log('✅ 礼物删除已同步到云端');
    } catch (error) {
      console.error('❌ 同步礼物删除失败:', error);
    }
  }

  /**
   * 添加记录到云端
   */
  async addRecord(record) {
    if (!this.enabled) return record;

    try {
      const { data, error } = await supabaseClient
        .from('records')
        .insert([{
          task_id: record.taskId || null,
          task_name: record.taskName,
          score: record.score,
          note: record.note || '',
          date: record.date
        }])
        .select();

      if (error) throw error;
      console.log('✅ 记录已同步到云端:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ 同步记录到云端失败:', error);
      return record;
    }
  }

  /**
   * 添加兑换申请到云端
   */
  async addRequest(request) {
    if (!this.enabled) return request;

    try {
      const { data, error } = await supabaseClient
        .from('requests')
        .insert([{
          gift_id: request.giftId || null,
          gift_name: request.giftName,
          score: request.score,
          status: request.status || 'pending',
          date: request.date
        }])
        .select();

      if (error) throw error;
      console.log('✅ 兑换申请已同步到云端:', data[0]);
      return data[0];
    } catch (error) {
      console.error('❌ 同步兑换申请到云端失败:', error);
      return request;
    }
  }

  /**
   * 更新兑换申请到云端
   */
  async updateRequest(request) {
    if (!this.enabled || !request.id) return;

    try {
      const { error } = await supabaseClient
        .from('requests')
        .update({
          status: request.status
        })
        .eq('id', request.id);

      if (error) throw error;
      console.log('✅ 兑换申请更新已同步到云端');
    } catch (error) {
      console.error('❌ 同步兑换申请更新失败:', error);
    }
  }

  /**
   * 更新设置到云端
   */
  async updateSetting(key, value) {
    if (!this.enabled) return;

    try {
      const { error } = await supabaseClient
        .from('settings')
        .upsert({
          key: key,
          value: value,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      console.log(`✅ 设置 ${key} 已同步到云端`);
    } catch (error) {
      console.error('❌ 同步设置失败:', error);
    }
  }

  /**
   * 手动触发完整同步
   */
  async manualSync() {
    if (!this.enabled) {
      console.log('❌ 云同步未启用');
      return false;
    }

    try {
      await this.syncFromCloud();
      console.log('✅ 手动同步完成');
      return true;
    } catch (error) {
      console.error('❌ 手动同步失败:', error);
      return false;
    }
  }

  /**
   * 数据迁移：将本地数据上传到云端
   */
  async migrateLocalToCloud() {
    if (!this.enabled) {
      console.log('❌ 云同步未启用，无法迁移');
      return { success: false, message: '云同步未启用' };
    }

    try {
      let uploadCount = 0;

      // 迁移任务
      const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      if (localTasks.length > 0) {
        for (const task of localTasks) {
          await this.addTask(task);
          uploadCount++;
        }
      }

      // 迁移礼物
      const localGifts = JSON.parse(localStorage.getItem('gifts') || '[]');
      if (localGifts.length > 0) {
        for (const gift of localGifts) {
          await this.addGift(gift);
          uploadCount++;
        }
      }

      // 迁移记录
      const localRecords = JSON.parse(localStorage.getItem('records') || '[]');
      if (localRecords.length > 0) {
        for (const record of localRecords) {
          await this.addRecord(record);
          uploadCount++;
        }
      }

      // 迁移兑换申请
      const localRequests = JSON.parse(localStorage.getItem('requests') || '[]');
      if (localRequests.length > 0) {
        for (const request of localRequests) {
          await this.addRequest(request);
          uploadCount++;
        }
      }

      console.log(`✅ 数据迁移完成，共上传 ${uploadCount} 条数据`);
      return { success: true, count: uploadCount };
    } catch (error) {
      console.error('❌ 数据迁移失败:', error);
      return { success: false, message: error.message };
    }
  }
}

// 创建全局实例
window.supabaseSync = new SupabaseSync();

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseSync, SupabaseSync };
}
