import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import actionDownload from '../assets/figma/action-download.svg'
import actionEdit from '../assets/figma/action-edit.svg'
import actionExternal from '../assets/figma/action-external.svg'
import actionRefresh from '../assets/figma/action-refresh.svg'
import actionTrash from '../assets/figma/action-trash.svg'
import actionsChevron from '../assets/figma/actions-chevron.svg'
import attach from '../assets/figma/attach.svg'
import avatarBackground from '../assets/figma/avatar-background.svg'
import avatarChevron from '../assets/figma/avatar-chevron.svg'
import assistantBook from '../assets/figma/chat-assistant-book.svg'
import assistantCircle from '../assets/figma/chat-assistant-circle.svg'
import conversation from '../assets/figma/chat-conversation.svg'
import userAvatar from '../assets/figma/chat-user-avatar.svg'
import dashboardChat from '../assets/figma/dashboard-chat.svg'
import docMindIcon from '../assets/figma/docmind-icon.svg'
import documentFailed from '../assets/figma/document-file-failed.svg'
import documentFile from '../assets/figma/document-file.svg'
import documentLink from '../assets/figma/document-link.svg'
import pdf from '../assets/figma/pdf.svg'
import profileAvatar from '../assets/figma/profile-avatar.svg'
import profileSettings from '../assets/figma/profile-settings.svg'
import profileUpload from '../assets/figma/profile-upload.svg'
import purpleAmbient from '../assets/figma/purple-ambient.svg'
import search from '../assets/figma/search.svg'
import sourceFile from '../assets/figma/source-file.svg'
import sourceOpen from '../assets/figma/source-open.svg'
import tealAmbient from '../assets/figma/teal-ambient.svg'
import uploadArrow from '../assets/figma/upload-arrow.svg'
import uploadDocx from '../assets/figma/upload-file-docx.svg'
import uploadPdf from '../assets/figma/upload-file-pdf.svg'
import { renderApp } from './renderApp.jsx'

function expectLocalAssets(container, assets) {
  const images = [...container.querySelectorAll('img')]
  expect(images.some((image) => image.src.includes('figma.com/api/mcp/asset'))).toBe(false)
  for (const [label, source] of assets) {
    const image = images.find((candidate) => candidate.getAttribute('src') === source)
    expect(image, `${label} should render`).toBeDefined()
    expect(image).toHaveAttribute('alt', '')
  }
}

describe('local Figma assets', () => {
  it('renders shared, Dashboard, and profile-menu SVGs locally', async () => {
    const user = userEvent.setup()
    const { container } = renderApp()

    expectLocalAssets(container, [
      ['teal ambient', tealAmbient],
      ['purple ambient', purpleAmbient],
      ['DocMind icon', docMindIcon],
      ['avatar background', avatarBackground],
      ['avatar chevron', avatarChevron],
      ['Dashboard chat icon', dashboardChat],
    ])

    await user.click(screen.getByRole('button', { name: 'Open profile menu' }))
    expectLocalAssets(container, [['profile avatar', profileAvatar], ['profile upload', profileUpload], ['profile settings', profileSettings]])
  })

  it('renders the Chat SVGs locally', () => {
    const { container } = renderApp({ route: '/chat' })
    expectLocalAssets(container, [
      ['conversation icon', conversation],
      ['user avatar', userAvatar],
      ['assistant circle', assistantCircle],
      ['assistant book', assistantBook],
      ['source file', sourceFile],
      ['source open', sourceOpen],
      ['attachment icon', attach],
    ])
  })

  it('renders Documents and detail-action SVGs locally', async () => {
    const list = renderApp({ route: '/documents' })
    expectLocalAssets(list.container, [['search icon', search], ['document file', documentFile], ['document link', documentLink], ['failed document', documentFailed]])
    list.unmount()

    const user = userEvent.setup()
    const detail = renderApp({ route: '/documents/doc-123' })
    expectLocalAssets(detail.container, [['PDF icon', pdf], ['actions chevron', actionsChevron]])
    await user.click(screen.getByRole('button', { name: 'Actions' }))
    expectLocalAssets(detail.container, [['external action', actionExternal], ['download action', actionDownload], ['refresh action', actionRefresh], ['edit action', actionEdit], ['trash action', actionTrash]])
  })

  it('renders Upload SVGs locally', () => {
    const { container } = renderApp({ route: '/upload' })
    expectLocalAssets(container, [['upload arrow', uploadArrow], ['PDF upload file', uploadPdf], ['DOCX upload file', uploadDocx]])
  })
})
