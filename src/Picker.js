import React from 'react'

const colors = ['#000', 'white', '#ff461f', '#00bc12', '#065279', '#ff7500', '#e0eee8', '#801dae', '#845a33', '#ff0097']
const sizes = [4, 8, 12, 20, 30]

export default class Picker extends React.Component {

  render() {
    const {onPick, onSizeChange, color} = this.props
    return (
      <div style={{backgroundColor: '#ccc', borderRadius: 4, textAlign: 'center', padding: '6px 0'}}>
        <div style={{margin: '10px 0'}}>
          {sizes.map(size => (
            <div key={size}
                 onClick={() => onSizeChange(size)}
                 style={{
                   width: 30,
                   marginRight: 6,
                   display: 'inline-block',
                   verticalAlign: 'middle',
                 }}>
              <div style={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: color
              }}/>
            </div>
          ))}
        </div>
        <div>
          {colors.map((color) => {
            return <div
              key={color}
              onClick={() => onPick(color)}
              style={{
                backgroundColor: color,
                borderRadius: '50%',
                width: 20,
                height: 20,
                marginRight: 6,
                display: 'inline-block'
              }}/>
          })}
        </div>
      </div>
    )
  }
}
