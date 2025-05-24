import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';

// MongoDB连接配置
const MONGODB_URI = process.env.MONGODB_URI || process.env.ZEABUR_MONGODB_URI || 'mongodb://localhost:27017/herecho';

// 定义日志模型
const chatLogSchema = new mongoose.Schema({
    userId: String,
    sessionId: String,
    timestamp: { type: Date, default: Date.now },
    role: String,
    messageType: { type: String, enum: ['user', 'assistant'] },
    inputMethod: { type: String, enum: ['auto', 'manual'] },
    message: String,
    round: Number,
    metadata: {
        responseTime: Number,
        tokensUsed: Number
    }
});

const userStatsSchema = new mongoose.Schema({
    userId: String,
    totalSessions: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    averageSessionLength: { type: Number, default: 0 },
    preferredRoles: { type: Map, of: Number },
    autoReplyUsage: { type: Number, default: 0 },
    manualInputUsage: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now }
});

// 创建模型
const ChatLog = mongoose.model('ChatLog', chatLogSchema);
const UserStats = mongoose.model('UserStats', userStatsSchema);

class DatabaseService {
    private static instance: DatabaseService;
    private client: MongoClient;
    private isConnected: boolean = false;

    private constructor() {
        this.client = new MongoClient(MONGODB_URI);
    }

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }

    async connect() {
        if (!this.isConnected) {
            try {
                await mongoose.connect(MONGODB_URI, {
                    // 添加连接选项
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 45000,
                });
                this.isConnected = true;
                console.log('Successfully connected to MongoDB.');
            } catch (error) {
                console.error('MongoDB connection error:', error);
                throw error;
            }
        }
    }

    async logChat(data: {
        userId: string;
        sessionId: string;
        role: string;
        messageType: 'user' | 'assistant';
        inputMethod: 'auto' | 'manual';
        message: string;
        round: number;
        metadata: {
            responseTime: number;
            tokensUsed: number;
        };
    }) {
        try {
            const chatLog = new ChatLog(data);
            await chatLog.save();

            // 更新用户统计
            await this.updateUserStats(data.userId, data);
        } catch (error) {
            console.error('Error logging chat:', error);
            throw error;
        }
    }

    private async updateUserStats(userId: string, chatData: any) {
        try {
            const stats = await UserStats.findOne({ userId }) || new UserStats({ userId });

            stats.totalMessages += 1;
            stats.lastActive = new Date();

            if (chatData.inputMethod === 'auto') {
                stats.autoReplyUsage += 1;
            } else {
                stats.manualInputUsage += 1;
            }

            // 更新角色偏好
            if (!stats.preferredRoles) {
                stats.preferredRoles = new Map();
            }
            const currentCount = stats.preferredRoles.get(chatData.role) || 0;
            stats.preferredRoles.set(chatData.role, currentCount + 1);

            await stats.save();
        } catch (error) {
            console.error('Error updating user stats:', error);
            throw error;
        }
    }

    async getUserStats(userId: string) {
        try {
            return await UserStats.findOne({ userId });
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }

    async exportChatLogs(filters: any = {}) {
        try {
            return await ChatLog.find(filters).sort({ timestamp: 1 });
        } catch (error) {
            console.error('Error exporting chat logs:', error);
            throw error;
        }
    }
}

export default DatabaseService; 