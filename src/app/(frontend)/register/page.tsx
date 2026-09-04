'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    if (fields.get('password') !== fields.get('confirm')) { setMessage('两次密码输入不一致。'); return }
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/editor-application', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: fields.get('name'), email: fields.get('email'), password: fields.get('password'), applicationReason: fields.get('applicationReason') }) })
      const result = await response.json()
      setMessage(result.message || result.error || '提交失败，请稍后重试。')
      if (response.ok) { form.reset(); setDone(true) }
    } catch { setMessage('网络连接失败，请稍后重试。') }
    finally { setBusy(false) }
  }
  return <div className="container section-pad"><h1>申请编辑账号</h1><p>编辑可发布内容。账号须经管理员批准后才能登录；不开放管理员注册。</p>
    {!done && <form className="editor-application" onSubmit={submit}>
      <label>姓名<input name="name" required maxLength={80} autoComplete="name" /></label>
      <label>邮箱<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>密码（12–128位）<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
      <label>确认密码<input name="confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
      <label>申请说明<textarea name="applicationReason" required maxLength={1000} rows={4} /></label>
      <p>密码由系统安全哈希保存，管理员无法查看。请勿在申请说明中填写密码或其他敏感信息。</p>
      <button className="button button-primary" disabled={busy}>{busy ? '正在提交…' : '提交申请'}</button>
    </form>}
    <p role="status">{message}</p><Link href="/admin">已有账号？返回登录</Link>
  </div>
}
