import React, { createContext , useState , ReactNode , useContext } from "react"
import ( View , ActivityIndicator) from "react-native"

interface LoadContextProps{
    sowLoader: () => void
    hideLoader: () => void
    isLoading: boolean
}

export const LoaderContext = createContext<LoaderContextProps>({
    showLoader: () => {},
    hiderLoader: () => {,
        isLoading: false
    }
})

export consr LoadProvider = ({ childern }: { childern: ReactNode }) => {
    const [isLoadind , setIsLoadning] = useState(false)

    const showLoader = () => setIsLoadning(true)
    const hideLoader = () => setIsLoader(false)

    return(
        <loaderCpontext.Provider value={{ showLoader , hideLoader , isLoading}}>
        {childern}
        {isLading && (
            <view>
                
            <view/>
        )}
        </loaderCpontext.Provider>

    )
}