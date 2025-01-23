# MetaXplore Version 1.0
# Last modified on 05/30/2024
# Original Author: Naima BEL MOKHTAR (Email: naima1503@gmail.com)
# Modified by: Maulana Malik NASHRULLOH (Email: maulana@genbinesia.or.id)
########################################################

## Check and load packages

# using package_info for the extra info delivered
### -> you might need to change the lib.loc according to system/version
allpkgs <- (devtools::package_info(rownames(installed.packages(lib.loc = .libPaths())),include_base = T))
installed.cran.all <- allpkgs[grepl("cran",allpkgs$source,ignore.case = TRUE),]
installed.bioc.all <- allpkgs[grepl("Bioconductor",allpkgs$source),]
installed.github.all <-allpkgs[grepl("Github",allpkgs$source),]

# Print currently installed packages before additional installations
cat("\nCurrently installed CRAN packages:\n")
print(installed.cran.all$package)
cat("\nCurrently installed Bioconductor packages:\n")
print(installed.bioc.all$package)
cat("\nCurrently installed GitHub packages:\n")
print(installed.github.all$package)

# Install Cran packages not yet installed
pkgs.cran <- c("curl", "littler", "RNetCDF", "sf", "systemfonts", "terra", "lwgeom", "magick", "textshaping", "gdtools", "ragg", "flextable",
			   "shinydashboard", "shiny", "varhandle", "gplots", "ggplot2", "stringr",
               "shinyBS", "shinyjs", "shinythemes", "plotly", "reshape2",
               "DT", "magrittr", "dplyr", "RColorBrewer", "tidyr",
               "ade4", "GUniFrac", "phangorn", "cluster", "fpc", "assertr", 
               "units","ape", "picante", "circlize", "viridis", "vegan", 
               "shinydashboardPlus", "ggpubr", "tidyr", "shinyalert",
               "plotrix", "PerformanceAnalytics", "reshape", "funrar", "fossil", 
               "qdapTools", "measurements", "nloptr", "ggvenn","BiocManager", "jtools",
			   "networkD3", "adespatial",
			   "CFtime", "rtf", "PKI"
               )
installed.pkgs.cran <- pkgs.cran %in% installed.cran.all$package
if (any(installed.pkgs.cran == FALSE)) {
  install.packages(pkgs.cran[!installed.pkgs.cran])
}



# Install Bioconductor packages not yet installed
pkgs.bioc <- c("ggtree", "microbiome", "phyloseq", "GenomicRanges", "ComplexHeatmap", 
			   "InteractiveComplexHeatmap", "DESeq2", "biobroom", "graphite",
			   "ggtreeExtra", "MicrobiotaProcess"
			   )
installed.pkgs.bioc <- pkgs.bioc %in% installed.bioc.all$package
if (any(installed.pkgs.bioc == FALSE)) {
  BiocManager::install(pkgs.bioc[!installed.pkgs.bioc])
}


#These packages only available in Github, use devtools to install them!
pkgs.github <- c("QsRutils", "pairwiseAdonis", "mattsUtils", "microeco", "file2meco") 
installed.pkgs.github <- pkgs.github %in% installed.github.all$package
if("QsRutils" %in% installed.github.all$package==F)
  devtools::install_github("jfq3/QsRutils", build_vignettes = TRUE)

if("pairwiseAdonis" %in% installed.github.all$package==F)
  devtools::install_github("pmartinezarbizu/pairwiseAdonis/pairwiseAdonis")

if("mattsUtils" %in% installed.github.all$package==F)
  devtools::install_github("mworkentine/mattsUtils", build_vignettes = TRUE)

if("microeco" %in% installed.github.all$package==F)
  devtools::install_github("ChiLiubio/microeco", build_vignettes = TRUE)

if("file2meco" %in% installed.github.all$package==F)
  devtools::install_github("ChiLiubio/file2meco", build_vignettes = TRUE)

# Packages loading
invisible(lapply(pkgs.cran, library, character.only = TRUE))

# library(shinydashboard)
# library(shiny)
# library(varhandle)
# library(gplots)
# library(ggplot2)
# library(shinyBS)
# library(shinyjs)
# library(shinythemes)
# library(plotly)
# library(reshape2)
# library(DT)
# library(magrittr)
# library(dplyr)
# library(RColorBrewer)
# library(tidyr)
# library(ade4)
# library(GUniFrac)
# library(phangorn)
# library(cluster)
# library(fpc)
# library(assertr)
# library(units)
# library(ape)
# library(picante)
# library(circlize)
# library(viridis)
# library(vegan)
# library(shinydashboardPlus)
# library(ggpubr)
# library(tidyr)
# library(stringr)
# library(shinyalert)
# library(plotrix)
# library(PerformanceAnalytics)
# library(reshape)
# library(funrar)
# library(fossil)
# library(qdapTools)
# library(measurements)
# 
# library(ggtree) #bioconductor
# library(phyloseq)
# library(ComplexHeatmap)
# library(InteractiveComplexHeatmap)
# library(microbiome)
# 
# #devtools::install_github("jfq3/QsRutils", build_vignettes = TRUE)
# library(QsRutils)
# 
# #install_github("pmartinezarbizu/pairwiseAdonis/pairwiseAdonis")
# library(pairwiseAdonis)
# 
# #devtools::install_github("yanlinlin82/ggvenn")
# library(ggvenn)
