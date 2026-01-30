import styles from './Container.module.css'

function Container({ as: Component = 'div', className = '', children }) {
  return <Component className={`${styles.container} ${className}`}>{children}</Component>
}

export default Container
