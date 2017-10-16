import React from 'react'
import ReactDom from 'react-dom'

import Picker from './Picker'
import {params, clear} from './canvas'

class RootElement extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      num: null,
      color: '#000'
    }
    document.addEventListener('updateNum', e => this.setState({num: e.detail.num}))
  }

  pickColor = color => {
    params.color = color
    this.setState({color})
  }

  pickSize = size => params.size = size

  updateNum = num => this.setState({num})

  render() {
    const {num, color} = this.state
    return (
      <div>
        <div style={{textAlign: 'center', border: '1px solid chocolate', marginBottom: 4, cursor: 'pointer'}}
             onClick={clear}
        >CLEAR
        </div>
        <Picker color={color} onPick={this.pickColor} onSizeChange={this.pickSize}/>
        {!!num && <div>
          Predicted: {num}
        </div>}
      </div>
    )
  }
}

ReactDom.render(
  <div>
    <RootElement/>
  </div>,
  document.getElementById('root')
)

