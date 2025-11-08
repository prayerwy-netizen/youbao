// Supabase 配置文件
// 使用说明：将下面的 SUPABASE_URL 和 SUPABASE_ANON_KEY 替换成你的实际值

const SUPABASE_URL = 'https://your-project.supabase.co'  // 替换：你的 Supabase Project URL
const SUPABASE_ANON_KEY = 'your-anon-key-here'  // 替换：你的 Supabase anon public key

// 检查是否已配置
const isSupabaseConfigured = SUPABASE_URL !== 'https://your-project.supabase.co'

// 初始化 Supabase 客户端
let supabase = null
if (isSupabaseConfigured && typeof window.supabase !== 'undefined') {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  console.log('✅ Supabase 已连接')
} else if (!isSupabaseConfigured) {
  console.log('ℹ️ Supabase 未配置，使用本地存储模式')
} else {
  console.warn('⚠️ Supabase 客户端库未加载')
}

/**
 * Supabase 数据同步管理器
 * 负责在本地 LocalStorage 和云端 Supabase 之间同步数据
 */
class SupabaseDataManager {
  constructor() {
    this.enabled = isSupabaseConfigured && supabase !== null
    if (this.enabled) {
      this.initSync()
    }
  }

  /**
   * 初始化同步：从云端拉取最新数据到本地
   */
  async initSync() {
    try {
      console.log('🔄 开始从云端同步数据...')
      await this.syncFromCloud()
      console.log('✅ 数据同步完成')
    } catch (error) {
      console.error('❌ 同步失败，使用本地数据:', error.message)
    }
  }

  /**
   * 从云端同步所有数据到本地
   */
  async syncFromCloud() {
    if (!this.enabled) return

    try {
      // 同步任务
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('id', { ascending: true })

      if (tasksError) throw tasksError
      if (tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks))
        console.log(`  ✓ 同步了 ${tasks.length} 个任务`)
      }

      // 同步礼物
      const { data: gifts, error: giftsError } = await supabase
        .from('gifts')
        .select('*')
        .order('id', { ascending: true })

      if (giftsError) throw giftsError
      if (gifts) {
        localStorage.setItem('gifts', JSON.stringify(gifts))
        console.log(`  ✓ 同步了 ${gifts.length} 个礼物`)
      }

      // 同步记录
      const { data: records, error: recordsError } = await supabase
        .from('records')
        .select('*')
        .order('date', { ascending: false })

      if (recordsError) throw recordsError
      if (records) {
        localStorage.setItem('records', JSON.stringify(records))
        console.log(`  ✓ 同步了 ${records.length} 条记录`)
      }

      // 同步兑换申请
      const { data: requests, error: requestsError } = await supabase
        .from('requests')
        .select('*')
        .order('date', { ascending: false })

      if (requestsError) throw requestsError
      if (requests) {
        localStorage.setItem('requests', JSON.stringify(requests))
        console.log(`  ✓ 同步了 ${requests.length} 个兑换申请`)
      }

      // 同步系统设置
      const { data: settings, error: settingsError } = await supabase
        .from('settings')
        .select('*')

      if (settingsError) throw settingsError
      if (settings) {
        const settingsObj = {}
        settings.forEach(item => settingsObj[item.key] = item.value)
        localStorage.setItem('settings', JSON.stringify(settingsObj))
        console.log(`  ✓ 同步了 ${settings.length} 项设置`)
      }
    } catch (error) {
      console.error('同步数据时出错:', error)
      throw error
    }
  }

  /**
   * 同步任务到云端
   * @param {Object} task - 任务对象
   */
  async syncTask(task) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('tasks')
        .upsert(task, { onConflict: 'id' })

      if (error) throw error
      console.log('✓ 任务已同步到云端:', task.name)
    } catch (error) {
      console.error('同步任务失败:', error)
    }
  }

  /**
   * 从云端删除任务
   * @param {number} id - 任务 ID
   */
  async deleteTask(id) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) throw error
      console.log('✓ 任务已从云端删除:', id)
    } catch (error) {
      console.error('删除任务失败:', error)
    }
  }

  /**
   * 同步礼物到云端
   * @param {Object} gift - 礼物对象
   */
  async syncGift(gift) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('gifts')
        .upsert(gift, { onConflict: 'id' })

      if (error) throw error
      console.log('✓ 礼物已同步到云端:', gift.name)
    } catch (error) {
      console.error('同步礼物失败:', error)
    }
  }

  /**
   * 从云端删除礼物
   * @param {number} id - 礼物 ID
   */
  async deleteGift(id) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('gifts')
        .delete()
        .eq('id', id)

      if (error) throw error
      console.log('✓ 礼物已从云端删除:', id)
    } catch (error) {
      console.error('删除礼物失败:', error)
    }
  }

  /**
   * 同步积分记录到云端
   * @param {Object} record - 记录对象
   * @returns {Object} 插入后的记录（包含数据库生成的 ID）
   */
  async syncRecord(record) {
    if (!this.enabled) return record

    try {
      const { data, error } = await supabase
        .from('records')
        .insert([record])
        .select()

      if (error) throw error
      console.log('✓ 记录已同步到云端:', record.task_name)
      return data?.[0] || record
    } catch (error) {
      console.error('同步记录失败:', error)
      return record
    }
  }

  /**
   * 同步兑换申请到云端
   * @param {Object} request - 申请对象
   */
  async syncRequest(request) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('requests')
        .upsert(request, { onConflict: 'id' })

      if (error) throw error
      console.log('✓ 兑换申请已同步到云端:', request.gift_name)
    } catch (error) {
      console.error('同步申请失败:', error)
    }
  }

  /**
   * 从云端删除兑换申请
   * @param {number} id - 申请 ID
   */
  async deleteRequest(id) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('requests')
        .delete()
        .eq('id', id)

      if (error) throw error
      console.log('✓ 兑换申请已从云端删除:', id)
    } catch (error) {
      console.error('删除申请失败:', error)
    }
  }

  /**
   * 同步系统设置到云端
   * @param {string} key - 设置键
   * @param {string} value - 设置值
   */
  async syncSetting(key, value) {
    if (!this.enabled) return

    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value }, { onConflict: 'key' })

      if (error) throw error
      console.log('✓ 设置已同步到云端:', key)
    } catch (error) {
      console.error('同步设置失败:', error)
    }
  }

  /**
   * 将本地所有数据上传到云端（用于首次迁移）
   */
  async uploadAllLocalData() {
    if (!this.enabled) {
      console.error('Supabase 未配置')
      return
    }

    try {
      console.log('📤 开始上传本地数据到云端...')

      // 上传任务
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      if (tasks.length > 0) {
        for (const task of tasks) {
          await this.syncTask(task)
        }
      }

      // 上传礼物
      const gifts = JSON.parse(localStorage.getItem('gifts') || '[]')
      if (gifts.length > 0) {
        for (const gift of gifts) {
          await this.syncGift(gift)
        }
      }

      // 上传记录
      const records = JSON.parse(localStorage.getItem('records') || '[]')
      if (records.length > 0) {
        for (const record of records) {
          await this.syncRecord(record)
        }
      }

      // 上传申请
      const requests = JSON.parse(localStorage.getItem('requests') || '[]')
      if (requests.length > 0) {
        for (const request of requests) {
          await this.syncRequest(request)
        }
      }

      // 上传设置
      const settings = JSON.parse(localStorage.getItem('settings') || '{}')
      for (const [key, value] of Object.entries(settings)) {
        await this.syncSetting(key, value)
      }

      console.log('✅ 本地数据已全部上传到云端')
      alert('数据迁移成功！所有本地数据已上传到云端。')
    } catch (error) {
      console.error('上传数据失败:', error)
      alert('数据迁移失败：' + error.message)
    }
  }
}

// 创建全局实例
const supabaseSync = new SupabaseDataManager()

// 在控制台提供手动迁移命令
if (supabaseSync.enabled) {
  console.log('%c💡 提示:', 'color: #4A90E2; font-weight: bold;', '如需将本地数据迁移到云端，请在控制台执行: supabaseSync.uploadAllLocalData()')
}
