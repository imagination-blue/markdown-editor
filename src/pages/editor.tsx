import * as React from 'react'
import styled from 'styled-components'
import { putMemo } from '../indexeddb/memos'
import { Button } from '../components/button'
import { SaveModal } from '../components/save_modal'
import { Link } from 'react-router-dom'
import { Header } from '../components/header'
import ConvertMarkdownWorker from 'worker-loader!../worker/convert_markdown_worker'

const convertMarkdownWorker = new ConvertMarkdownWorker()
const { useState, useEffect } = React

interface Props {
  text: string
  setText: (text: string) => void
}

export const Editor: React.FC<Props> = (props) => {
  const { text, setText } = props
  const [showModal, setShowModal] = useState(false)
  const [html, setHtml] = useState('')

  const editorInput = (html) => {
    let returnString:string = ''
    let flag = false
    // 子要素を取り出す
    const childrenElements = Array.from(html.children)
    // 子要素が空だった場合pタグを入れる
    if (childrenElements.length === 0) {
      console.log('empty')
      // returnString += `${html.textContent}`
      // setText(html.textContent)
      html.innerHTML = `<p><br></p>`
    }

    // マークダウン書式を検知した場合の処理
    childrenElements.forEach((element:Element) => {
      const text: string = element.textContent
      const tag: string = element.tagName
      
      if (/^#+\s/.test(text)) {
        const md = text.slice(0, -1)
        const mdCoount = md.match(/#/g).length
        const elemH = document.createElement(`h${mdCoount}`)
        element.parentNode.replaceChild( elemH, element )
        elemH.innerHTML = text.replace(/^#+\s/, '<br />')
      }

      switch(tag) {
        case 'H1':
          returnString += `# ${element.textContent}\n`
          break
        case 'H2':
          returnString += `## ${element.textContent}\n`
          break
        case 'H3':
          returnString += `### ${element.textContent}\n`
          break
        case 'H4':
          returnString += `#### ${element.textContent}\n`
          break
        case 'H5':
          returnString += `##### ${element.textContent}\n`
          break
        case 'H6':
          returnString += `###### ${element.textContent}\n`
          break
        default:
          returnString += `${element.textContent}  \n`
      }
    })
    // console.log(returnString)
    setText(returnString)
  }

  useEffect(() => {
    console.log('uE1')
    convertMarkdownWorker.onmessage = (event) => {
      setHtml(event.data.html)
    }
  }, [])

  useEffect(() => {
    console.log(`useEffect: ${text}`)
    convertMarkdownWorker.postMessage(text)
  }, [text])

  return (
    <>
      <HeaderArea>
        <Header title="Markdown Editor">
          <Button onClick={() => setShowModal(true)}>
            保存する
          </Button>
          <Link to="/history">
            履歴を見る
          </Link>
        </Header>
      </HeaderArea>
      <Wrapper>
        <TextArea
          id='textarea'
          // onChange={(event) => {
          //   // console.log(event.target.value)
          //   // setText(event.target.value)
          // }}
          value={text}
          readOnly
        />
        <EditableArea>
          <div
            contentEditable
            onInput={(event) => {
              editorInput(event.target)
            }}
            // dangerouslySetInnerHTML={{ __html: html }}
          />
        </EditableArea>
        <Preview>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </Preview>
      </Wrapper>
      {showModal && (
        <SaveModal
          onSave={(title: string): void => {
            putMemo(title, text)
            setShowModal(false)
          }}
          onCancel={() => setShowModal(false)}
        />
      )}
    </>
  )
}

const Wrapper = styled.div`
  position: fixed;
  top: 3rem;
  bottom: 0;
  left: 0;
  right: 0;
`

const HeaderArea = styled.div`
  position: fixed;
  right: 0;
  top: 0;
  left: 0;
`

const TextArea = styled.textarea`
  border-right: 1px solid silver;
  border-top: 1px solid silver;
  bottom: 0;
  font-size: 1rem;
  left: 0;
  padding: 0.5rem;
  position: absolute;
  top: 0;
  width: 30vw;
`

const EditableArea = styled.div`
  border-right: 1px solid silver;
  border-top: 1px solid silver;
  bottom: 0;
  font-size: 1rem;
  left: 30vw;
  padding: 0.5rem;
  position: absolute;
  top: 0;
  width: 35vw;
  & > div {
    height: 100%;
    outline: none;
    & > div {
      margin: 1em 0;
    }
    & > *:first-child {
      margin-top: 0;
    }
  }
`

const Preview = styled.div`
  border-top: 1px solid silver;
  bottom: 0;
  overflow-y: scroll;
  padding: 1rem;
  position: absolute;
  right: 0;
  top: 0;
  width: 35vw;
  & > div > *:first-child {
    margin-top: 0;
  }
`
