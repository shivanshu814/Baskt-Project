#!/usr/bin/env node
import Redis from 'ioredis'
import { StreamType, STREAM_CONFIGS as streamConfig } from '../src/stream-config'
import chalk from 'chalk'
import Table from 'cli-table3'
import { format } from 'date-fns'

interface StreamHealth {
  stream: StreamType
  length: number
  consumers: ConsumerGroupInfo[]
  deadLetterCount: number
  oldestMessageAge?: number
  retentionViolation: boolean
  lastActivity?: Date
  anomalies: string[]
}

interface ConsumerGroupInfo {
  name: string
  pending: number
  lastDelivered?: string
  consumers: number
  lag?: number
}

class StreamHealthDashboard {
  private redis: Redis
  private updateInterval: NodeJS.Timer | null = null
  private monitoringActive = true
  
  constructor(redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.redis = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
    })
  }

  async start(refreshRate = 1000) {
    console.clear()
    console.log(chalk.cyan.bold('🚀 Redis Stream Health Dashboard'))
    console.log(chalk.gray('Press Ctrl+C to exit\n'))

    process.on('SIGINT', () => this.shutdown())
    process.on('SIGTERM', () => this.shutdown())

    await this.updateDashboard()
    this.updateInterval = setInterval(() => this.updateDashboard(), refreshRate)
  }

  private async updateDashboard() {
    try {
      const healthData = await this.collectHealthData()
      this.displayDashboard(healthData)
      this.checkAnomalies(healthData)
    } catch (error) {
      console.error(chalk.red('Error updating dashboard:', error))
    }
  }

  private async collectHealthData(): Promise<StreamHealth[]> {
    const streams = Object.keys(streamConfig) as StreamType[]
    const healthData: StreamHealth[] = []

    for (const stream of streams) {
      const health = await this.getStreamHealth(stream)
      healthData.push(health)
    }

    return healthData
  }

  private async getStreamHealth(stream: StreamType): Promise<StreamHealth> {
    const [
      length,
      groups,
      deadLetterCount,
      streamInfo,
      lastEntry
    ] = await Promise.all([
      this.getStreamLength(stream),
      this.getConsumerGroups(stream),
      this.getDeadLetterCount(stream),
      this.getStreamInfo(stream),
      this.getLastEntry(stream)
    ])

    const config = streamConfig[stream]
    const anomalies: string[] = []
    let oldestMessageAge: number | undefined
    let retentionViolation = false

    if (streamInfo.firstEntry) {
      const firstTimestamp = parseInt(streamInfo.firstEntry.split('-')[0])
      oldestMessageAge = Date.now() - firstTimestamp
      const maxRetentionMs = config.retention * 60 * 60 * 1000

      if (oldestMessageAge > maxRetentionMs * 1.1) {
        retentionViolation = true
        anomalies.push(`Retention violation: ${Math.round(oldestMessageAge / 60000)}min > ${config.retention}h`)
      }
    }

    if (deadLetterCount > 0) {
      anomalies.push(`${deadLetterCount} dead letters`)
    }

    for (const group of groups) {
      if (group.pending > 100) {
        anomalies.push(`High pending: ${group.name} (${group.pending})`)
      }
      
      if (group.lag && group.lag > 1000) {
        anomalies.push(`High lag: ${group.name} (${group.lag})`)
      }
    }

    if (length > config.maxMessages * 0.9) {
      anomalies.push(`Near capacity: ${Math.round(length / config.maxMessages * 100)}%`)
    }

    const lastActivity = lastEntry ? new Date(parseInt(lastEntry.id.split('-')[0])) : undefined

    return {
      stream,
      length,
      consumers: groups,
      deadLetterCount,
      oldestMessageAge,
      retentionViolation,
      lastActivity,
      anomalies
    }
  }

  private async getStreamLength(stream: StreamType): Promise<number> {
    try {
      return await this.redis.xlen(stream)
    } catch {
      return 0
    }
  }

  private async getConsumerGroups(stream: StreamType): Promise<ConsumerGroupInfo[]> {
    try {
      const groups = await this.redis.xinfo('GROUPS', stream)
      const groupInfos: ConsumerGroupInfo[] = []

      for (const group of groups) {
        const name = group[1]
        const consumers = group[3]
        const pending = group[5]
        const lastDelivered = group[7]

        const groupInfo: ConsumerGroupInfo = {
          name,
          pending,
          consumers,
          lastDelivered
        }

        if (lastDelivered && lastDelivered !== '0-0') {
          const streamEnd = await this.redis.xrevrange(stream, '+', '-', 'COUNT', 1)
          if (streamEnd.length > 0) {
            const lastId = streamEnd[0][0]
            const lastTimestamp = parseInt(lastId.split('-')[0])
            const deliveredTimestamp = parseInt(lastDelivered.split('-')[0])
            groupInfo.lag = lastTimestamp - deliveredTimestamp
          }
        }

        groupInfos.push(groupInfo)
      }

      return groupInfos
    } catch {
      return []
    }
  }

  private async getDeadLetterCount(stream: StreamType): Promise<number> {
    try {
      return await this.redis.xlen(`${stream}:dead`)
    } catch {
      return 0
    }
  }

  private async getStreamInfo(stream: StreamType): Promise<any> {
    try {
      const info = await this.redis.xinfo('STREAM', stream)
      const result: any = {}
      
      for (let i = 0; i < info.length; i += 2) {
        const key = info[i]
        const value = info[i + 1]
        result[key.replace(/-/g, '_')] = value
      }
      
      return result
    } catch {
      return {}
    }
  }

  private async getLastEntry(stream: StreamType): Promise<any> {
    try {
      const entries = await this.redis.xrevrange(stream, '+', '-', 'COUNT', 1)
      return entries.length > 0 ? { id: entries[0][0], data: entries[0][1] } : null
    } catch {
      return null
    }
  }

  private displayDashboard(healthData: StreamHealth[]) {
    console.clear()
    console.log(chalk.cyan.bold('🚀 Redis Stream Health Dashboard'))
    console.log(chalk.gray(`Last updated: ${format(new Date(), 'HH:mm:ss')}\n`))

    const table = new Table({
      head: [
        chalk.white('Stream'),
        chalk.white('Length'),
        chalk.white('Groups'),
        chalk.white('Dead'),
        chalk.white('Age'),
        chalk.white('Activity'),
        chalk.white('Status')
      ],
      colWidths: [20, 12, 25, 8, 10, 12, 40],
      style: { 'padding-left': 1, 'padding-right': 1 }
    })

    for (const health of healthData) {
      const statusColor = health.anomalies.length > 0 ? chalk.red : chalk.green
      const status = health.anomalies.length > 0 ? 
        health.anomalies.join(', ') : 
        chalk.green('✓ Healthy')

      const groupsInfo = health.consumers
        .map(g => `${g.name}(${g.pending})`)
        .join(', ') || 'None'

      const age = health.oldestMessageAge ? 
        `${Math.round(health.oldestMessageAge / 60000)}m` : 
        '-'

      const activity = health.lastActivity ? 
        format(health.lastActivity, 'HH:mm:ss') : 
        '-'

      table.push([
        chalk.cyan(health.stream),
        chalk.yellow(health.length.toString()),
        chalk.blue(groupsInfo),
        health.deadLetterCount > 0 ? chalk.red(health.deadLetterCount.toString()) : chalk.green('0'),
        health.retentionViolation ? chalk.red(age) : chalk.white(age),
        chalk.gray(activity),
        status
      ])
    }

    console.log(table.toString())

    const totalStreams = healthData.length
    const healthyStreams = healthData.filter(h => h.anomalies.length === 0).length
    const totalDeadLetters = healthData.reduce((sum, h) => sum + h.deadLetterCount, 0)
    const totalPending = healthData.reduce((sum, h) => 
      h.consumers.reduce((gSum, g) => gSum + g.pending, 0) + sum, 0)

    console.log(chalk.gray('\n─────────────────────────────────────────────────────────'))
    console.log(chalk.white('Summary:'), 
      chalk.green(`${healthyStreams}/${totalStreams} healthy`),
      chalk.yellow(`| ${totalPending} pending`),
      totalDeadLetters > 0 ? chalk.red(`| ${totalDeadLetters} dead letters`) : ''
    )
  }

  private checkAnomalies(healthData: StreamHealth[]) {
    const criticalAnomalies: string[] = []

    for (const health of healthData) {
      if (health.deadLetterCount > 10) {
        criticalAnomalies.push(
          chalk.red(`⚠️  CRITICAL: ${health.stream} has ${health.deadLetterCount} dead letters!`)
        )
      }

      if (health.retentionViolation) {
        criticalAnomalies.push(
          chalk.red(`⚠️  CRITICAL: ${health.stream} retention policy violated!`)
        )
      }

      for (const consumer of health.consumers) {
        if (consumer.pending > 1000) {
          criticalAnomalies.push(
            chalk.red(`⚠️  CRITICAL: ${health.stream}/${consumer.name} has ${consumer.pending} pending messages!`)
          )
        }
      }

      if (health.lastActivity) {
        const inactiveMinutes = (Date.now() - health.lastActivity.getTime()) / 60000
        if (health.stream.includes('price') && inactiveMinutes > 5) {
          criticalAnomalies.push(
            chalk.yellow(`⚠️  WARNING: ${health.stream} inactive for ${Math.round(inactiveMinutes)} minutes`)
          )
        }
      }
    }

    if (criticalAnomalies.length > 0) {
      console.log(chalk.red('\n🚨 ALERTS:'))
      criticalAnomalies.forEach(alert => console.log(alert))
    }
  }

  private async shutdown() {
    console.log(chalk.yellow('\n\nShutting down dashboard...'))
    this.monitoringActive = false
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    await this.redis.quit()
    process.exit(0)
  }
}

async function main() {
  const refreshRate = parseInt(process.argv[2]) || 1000
  const dashboard = new StreamHealthDashboard()
  
  console.log(chalk.cyan('Starting Stream Health Dashboard...'))
  console.log(chalk.gray(`Refresh rate: ${refreshRate}ms\n`))
  
  await dashboard.start(refreshRate)
}

main().catch(console.error)