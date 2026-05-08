import styles from './DisclaimerBanner.module.css'

export function DisclaimerBanner() {
  return (
    <div className={styles.banner} role="status">
      <strong>Synthetic demonstration tool:</strong> this application generates illustrative architectures and mock outcomes only.
      It is not FDA cleared / CE marked clinical software. <strong>Do not enter PHI.</strong> Do not interpret outputs as real patient
      predictions.
    </div>
  )
}
