import * as fs from 'fs'
import * as path from 'path'
import axios from 'axios'
import { window, workspace } from 'vscode'
import TranslateEngine, { TranslateOptions, TranslateResult } from './base'
import { Config } from '~/core'
import i18n from '~/i18n'

export default class OpenAITranslate extends TranslateEngine {
  apiRoot = 'https://api.openai.com'

  async getSystemPrompt(): Promise<string | undefined> {
    // Get the prompt file path from config or use default
    const promptFilePath = Config.aiSystemPromptFile || 'i18n-translation-instruction.md'

    if (workspace.workspaceFolders) {
      const workspaceRoot = workspace.workspaceFolders[0].uri.fsPath
      const fullPath = path.isAbsolute(promptFilePath)
        ? promptFilePath
        : path.join(workspaceRoot, promptFilePath)

      try {
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8')
          // Extract the prompt from markdown - look for the first non-header content
          const lines = content.split('\n')
          const promptLines: string[] = []
          let inPromptSection = false

          for (const line of lines) {
            // Skip markdown headers and empty lines at the beginning
            if (!inPromptSection && (line.startsWith('#') || line.trim() === ''))
              continue

            // Start collecting prompt when we hit non-header content
            if (!line.startsWith('#') && line.trim() !== '') {
              inPromptSection = true
              promptLines.push(line)
            }
            else if (inPromptSection && line.startsWith('#')) {
              // Stop at the next header
              break
            }
            else if (inPromptSection) {
              promptLines.push(line)
            }
          }

          const extractedPrompt = promptLines.join('\n').trim()
          if (extractedPrompt) {
            // console.log(`Using AI system prompt from: ${fullPath}`)
            return extractedPrompt
          }
        }
      }
      catch (error) {
        console.warn(`Failed to read AI system prompt file: ${fullPath}`, error)
      }
    }

    // Fall back to default prompt if no file exists
    return 'You are a professional translation engine. Please translate text without explanation.'
  }

  async translate(options: TranslateOptions) {
    let apiKey = await Config.getOpenaiApiKey()
    if (!apiKey)
      apiKey = await Config.promptOpenaiApiKey()

    if (!apiKey) {
      const message = i18n.t('prompt.openai_api_key_required')
      window.showErrorMessage(message)
      throw new Error(message)
    }
    let apiRoot = this.apiRoot
    if (Config.openaiApiRoot) apiRoot = Config.openaiApiRoot.replace(/\/$/, '')
    const model = Config.openaiApiModel
    const systemPrompt = await this.getSystemPrompt()

    const response = await axios.post(
      `${apiRoot}/v1/chat/completions`,
      {
        model,
        top_p: 1,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: this.generateUserPrompts(options),
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
      },
    )

    return this.transform(response, options)
  }

  transform(response: any, options: TranslateOptions): TranslateResult {
    const { text, from = 'auto', to = 'auto' } = options

    const translatedText = response.data.choices[0].message.content?.trim()

    const r: TranslateResult = {
      text,
      to,
      from,
      response,
      result: translatedText ? [translatedText] : undefined,
      linkToResult: '',
    }

    return r
  }

  generateUserPrompts(options: TranslateOptions): string {
    const sourceLang = options.from
    const targetLang = options.to

    const generatedUserPrompt = `translate from ${sourceLang} to ${targetLang}:\n\n${options.text}`

    return generatedUserPrompt
  }
}
